require("dotenv").config();

const { redisClient, connectRedis } = require("../config/redisClient");
const {
  saveLookupLog,
  getDomainFromDb,
  fetchAndStoreDomainFromRdap
} = require("../services/domainDataService");

async function getDomainByName(req, res) {
  const startTime = Date.now();
  const domain = req.params.name.toLowerCase();
  const cacheKey = `domain:${domain}`;

  try {
    await connectRedis();

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const responseTimeMs = Date.now() - startTime;

      console.log("Data fetched from Redis/Cache");

      await saveLookupLog({
        domainName: domain,
        queryType: "RDAP",
        responseStatus: 200,
        success: true,
        source: "REDIS",
        responseTimeMs,
        cacheMiss: false
      });

      return res.status(200).json(JSON.parse(cached));
    }

    const dbData = await getDomainFromDb(domain);

    if (dbData) {
      await redisClient.set(cacheKey, JSON.stringify(dbData.result), {
        EX: 86400
      });

      const responseTimeMs = Date.now() - startTime;

      console.log("Data fetched from MySQL");

      await saveLookupLog({
        domainId: dbData.domainRecord.id,
        domainName: domain,
        queryType: "RDAP",
        responseStatus: 200,
        success: true,
        source: "MYSQL",
        responseTimeMs,
        cacheMiss: true
      });

      return res.status(200).json(dbData.result);
    }

    const { domainRecord, result, responseStatus } =
      await fetchAndStoreDomainFromRdap(domain, "RDAP", "RDAP");

    await redisClient.set(cacheKey, JSON.stringify(result), {
      EX: 86400
    });

    const responseTimeMs = Date.now() - startTime;

    console.log("Data fetched from RDAP");

    await saveLookupLog({
      domainId: domainRecord.id,
      domainName: domain,
      queryType: "RDAP",
      responseStatus,
      success: true,
      source: "RDAP",
      responseTimeMs,
      cacheMiss: true
    });

    return res.status(200).json(result);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    console.error("Błąd endpointu:", error.message);

    try {
      await saveLookupLog({
        domainName: domain,
        queryType: "RDAP",
        responseStatus: 500,
        success: false,
        errorMessage: error.message,
        source: "ERROR",
        responseTimeMs,
        cacheMiss: null
      });
    } catch (logError) {
      console.error("Błąd zapisu lookup log:", logError.message);
    }

    return res.status(500).json({
      message: "Błąd podczas pobierania danych domeny"
    });
  }
}

module.exports = { getDomainByName };