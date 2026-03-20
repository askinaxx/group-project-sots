require("dotenv").config();

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function formatDateOnly(dateString) {
  if (!dateString) return null;
  return dateString.slice(0, 10);
}

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
  return event?.eventDate || null;
}

function calculateDaysLeft(expiresAt) {
  if (!expiresAt) return null;

  const today = new Date();
  const expiry = new Date(expiresAt);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function getDomainInfo(domain) {
  try {
    const url = `https://rdap.org/domain/${domain}`;
    const response = await axios.get(url);
    const data = response.data;

    const registrarName = getRegistrarName(data);

    const createdAtRaw = getEventDate(data, "registration");
    const expiresAtRaw = getEventDate(data, "expiration");
    const updatedAtRaw = getEventDate(data, "last changed");

    const createdAt = formatDateOnly(createdAtRaw);
    const expiresAt = formatDateOnly(expiresAtRaw);
    const updatedAt = formatDateOnly(updatedAtRaw);
    const lastCheckedAt = formatDateOnly(new Date().toISOString());

    const daysLeft = calculateDaysLeft(expiresAtRaw);
    const statusArray = Array.isArray(data.status) ? data.status : [];
    const statusText = JSON.stringify(statusArray);

    console.log("=== WYNIK RDAP ===");
    console.log("Domena:", domain);
    console.log("Kod odpowiedzi:", response.status);
    console.log("Registrar:", registrarName || "brak");
    console.log("Created at:", createdAt || "brak");
    console.log("Expires at:", expiresAt || "brak");
    console.log("Updated at:", updatedAt || "brak");
    console.log("Days left:", daysLeft);
    console.log("Status:", statusArray);

    const domainRecord = await prisma.domain.upsert({
      where: { domainName: domain },
      update: {
        registrar: registrarName,
        createdAt,
        updatedAt,
        expiresAt,
        daysLeft,
        status: statusText,
        rdapUrl: data.links?.[0]?.href || null,
        lastCheckedAt
      },
      create: {
        domainName: domain,
        registrar: registrarName,
        createdAt,
        updatedAt,
        expiresAt,
        daysLeft,
        status: statusText,
        rdapUrl: data.links?.[0]?.href || null,
        lastCheckedAt
      }
    });

    await prisma.lookupHistory.create({
      data: {
        domainId: domainRecord.id,
        domainName: domain,
        queryType: "RDAP",
        responseStatus: response.status,
        success: true,
        checkedAt: lastCheckedAt
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

    console.log("Dane zapisane do bazy.");
  } catch (error) {
    console.log("=== BŁĄD PODCZAS ZAPYTANIA ===");

    if (error.response) {
      console.log("Kod błędu:", error.response.status);

      await prisma.lookupHistory.create({
        data: {
          domainName: domain,
          queryType: "RDAP",
          responseStatus: error.response.status,
          success: false,
          checkedAt: new Date().toISOString().slice(0, 10),
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
          checkedAt: new Date().toISOString().slice(0, 10),
          errorMessage: error.message
        }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

getDomainInfo("google.com");