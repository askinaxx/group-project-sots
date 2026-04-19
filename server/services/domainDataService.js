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

async function saveLookupLog({
  domainId = null,
  domainName,
  queryType = "RDAP",
  responseStatus = null,
  success,
  errorMessage = null,
  source = null,
  responseTimeMs = null,
  cacheMiss = null
}) {
  await prisma.lookupHistory.create({
    data: {
      domainId,
      domainName,
      queryType,
      responseStatus,
      success,
      checkedAt: new Date().toISOString().slice(0, 10),
      errorMessage,
      source,
      responseTimeMs,
      cacheMiss
    }
  });
}

async function getDomainFromDb(domain) {
  const domainRecord = await prisma.domain.findUnique({
    where: { domainName: domain }
  });

  if (!domainRecord) return null;

  const nameservers = await prisma.nameserver.findMany({
    where: { domainId: domainRecord.id }
  });

  return {
    domainRecord,
    result: mapResponse(domainRecord, nameservers)
  };
}

async function fetchAndStoreDomainFromRdap(
  domain,
  logSource = "RDAP",
  queryType = "RDAP"
) {
  const startTime = Date.now();

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

  const responseTimeMs = Date.now() - startTime;

  await saveLookupLog({
    domainId: domainRecord.id,
    domainName: domain,
    queryType,
    responseStatus: response.status,
    success: true,
    source: logSource,
    responseTimeMs,
    cacheMiss: true
  });

  return {
    domainRecord,
    result: {
      domainName: domain,
      registrar: registrarName,
      createdAt,
      updatedAt,
      expiresAt,
      daysLeft,
      status: statusArray,
      nameservers: nameserverData.map(ns => ns.nameserver)
    },
    responseStatus: response.status
  };
}

async function getTopSearchedDomains(limit = 5) {
  const grouped = await prisma.lookupHistory.groupBy({
    by: ["domainName"],
    _count: {
      domainName: true
    },
    orderBy: {
      _count: {
        domainName: "desc"
      }
    },
    take: limit
  });

  return grouped
    .map(item => item.domainName)
    .filter(Boolean);
}

module.exports = {
  prisma,
  saveLookupLog,
  getDomainFromDb,
  fetchAndStoreDomainFromRdap,
  getTopSearchedDomains
};