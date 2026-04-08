require("dotenv").config();

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { redisClient, connectRedis } = require("../config/redisClient");

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

function mapResponse(domainRecord, nameservers) {
  let statusArray = [];

  try {
    statusArray = domainRecord.status ? JSON.parse(domainRecord.status) : [];
  } catch {
    statusArray = [];
  }

  return {
    domainName: domainRecord.domainName,
    registrar: domainRecord.registrar,
    createdAt: domainRecord.createdAt,
    updatedAt: domainRecord.updatedAt,
    expiresAt: domainRecord.expiresAt,
    daysLeft: domainRecord.daysLeft,
    status: statusArray,
    nameservers: nameservers.map(ns => ns.nameserver)
  };
}

async function fetchFromRdap(domain) {
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

  const nameserverData = (data.nameservers || []).map(ns => ({
    domainId: domainRecord.id,
    nameserver: ns.ldhName || "brak"
  }));

  if (nameserverData.length > 0) {
    await prisma.nameserver.createMany({
      data: nameserverData
    });
  }

  return {
    domainName: domain,
    registrar: registrarName,
    createdAt,
    updatedAt,
    expiresAt,
    daysLeft,
    status: statusArray,
    nameservers: nameserverData.map(ns => ns.nameserver)
  };
}

async function getDomainByName(req, res) {
  const domain = req.params.name.toLowerCase();

  try {
    await connectRedis();

    const cached = await redisClient.get(domain);

    if (cached) {
      console.log("Data fetched from Redis/Cache");
      return res.status(200).json(JSON.parse(cached));
    }

    const domainRecord = await prisma.domain.findUnique({
      where: { domainName: domain }
    });

    if (domainRecord) {
      const nameservers = await prisma.nameserver.findMany({
        where: { domainId: domainRecord.id }
      });

      const result = mapResponse(domainRecord, nameservers);

      await redisClient.set(domain, JSON.stringify(result), {
        EX: 86400
      });

      console.log("Data fetched from MySQL");
      return res.status(200).json(result);
    }

    const result = await fetchFromRdap(domain);

    await redisClient.set(domain, JSON.stringify(result), {
      EX: 86400
    });

    console.log("Data fetched from RDAP");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Błąd endpointu:", error.message);
    return res.status(500).json({
      message: "Błąd podczas pobierania danych domeny"
    });
  }
}

module.exports = { getDomainByName };