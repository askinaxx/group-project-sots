require("dotenv").config();

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function getRegistrarName(data) {
  const registrarEntity = data.entities?.find(entity =>
    entity.roles?.includes("registrar")
  );

  if (!registrarEntity?.vcardArray?.[1]) return null;

  const fnField = registrarEntity.vcardArray[1].find(field => field[0] === "fn");
  return fnField ? fnField[3] : null;
}

function getEventDate(data, actionName) {
  const event = data.events?.find(event => event.eventAction === actionName);
  return event?.eventDate ? new Date(event.eventDate) : null;
}

async function getDomainInfo(domain) {
  try {
    const url = `https://rdap.org/domain/${domain}`;
    const response = await axios.get(url);
    const data = response.data;

    const registrarName = getRegistrarName(data);
    const createdAt = getEventDate(data, "registration");
    const expiresAt = getEventDate(data, "expiration");
    const updatedAt = getEventDate(data, "last changed");

    console.log("=== WYNIK RDAP ===");
    console.log("Domena:", domain);
    console.log("Kod odpowiedzi:", response.status);
    console.log("LDH Name:", data.ldhName || "brak");
    console.log("Handle:", data.handle || "brak");
    console.log("Registrar:", registrarName || "brak");
    console.log("Created at:", createdAt || "brak");
    console.log("Expires at:", expiresAt || "brak");
    console.log("Updated at:", updatedAt || "brak");
    console.log("Status domeny:", data.status || "brak");

    const domainRecord = await prisma.domain.upsert({
      where: { domainName: domain },
      update: {
        registrar: registrarName,
        createdAt,
        updatedAt,
        expiresAt,
        status: Array.isArray(data.status) ? data.status.join(", ") : String(data.status || ""),
        rdapUrl: data.links?.[0]?.href || null,
        lastCheckedAt: new Date()
      },
      create: {
        domainName: domain,
        registrar: registrarName,
        createdAt,
        updatedAt,
        expiresAt,
        status: Array.isArray(data.status) ? data.status.join(", ") : String(data.status || ""),
        rdapUrl: data.links?.[0]?.href || null,
        lastCheckedAt: new Date()
      }
    });

    await prisma.lookupHistory.create({
      data: {
        domainId: domainRecord.id,
        domainName: domain,
        queryType: "RDAP",
        responseStatus: response.status,
        success: true,
        rawResponse: JSON.stringify(data)
      }
    });

    await prisma.nameserver.deleteMany({
      where: { domainId: domainRecord.id }
    });

    if (data.nameservers && data.nameservers.length > 0) {
      console.log("Nameservery:");

      for (const [index, ns] of data.nameservers.entries()) {
        const nsName = ns.ldhName || "brak";
        console.log(`${index + 1}. ${nsName}`);

        await prisma.nameserver.create({
          data: {
            domainId: domainRecord.id,
            nameserver: nsName
          }
        });
      }
    } else {
      console.log("Brak nameserverów");
    }

    console.log("Pełny JSON:");
    console.log(JSON.stringify(data, null, 2));
    console.log("Dane zapisane do bazy.");
  } catch (error) {
    console.log("=== BŁĄD PODCZAS ZAPYTANIA ===");

    if (error.response) {
      console.log("Kod błędu:", error.response.status);
      console.log("Odpowiedź API:", error.response.data);

      await prisma.lookupHistory.create({
        data: {
          domainName: domain,
          queryType: "RDAP",
          responseStatus: error.response.status,
          success: false,
          rawResponse: JSON.stringify(error.response.data),
          errorMessage: "Błąd odpowiedzi API"
        }
      });
    } else {
      console.log("Błąd:", error.message);

      await prisma.lookupHistory.create({
        data: {
          domainName: domain,
          queryType: "RDAP",
          success: false,
          errorMessage: error.message
        }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

getDomainInfo("google.com");