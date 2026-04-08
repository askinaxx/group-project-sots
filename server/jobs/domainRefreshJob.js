const cron = require("node-cron");
const { redisClient, connectRedis } = require("../config/redisClient");
const {
  getTopSearchedDomains,
  fetchAndStoreDomainFromRdap
} = require("../services/domainDataService");

async function refreshTopDomains() {
  try {
    await connectRedis();

    const domains = await getTopSearchedDomains(5);

    if (!domains.length) {
      console.log("Cron: brak domen do odświeżenia.");
      return;
    }

    console.log("Cron: start odświeżania domen:", domains);

    for (const domain of domains) {
      const { result } = await fetchAndStoreDomainFromRdap(
        domain,
        "CRON_RDAP",
        "CRON_REFRESH"
      );

      const cacheKey = `domain:${domain}`;

      await redisClient.set(cacheKey, JSON.stringify(result), {
        EX: 86400
      });

      console.log(`Cron: odświeżono ${domain}`);
    }

    console.log("Cron: zakończono odświeżanie danych.");
  } catch (error) {
    console.error("Cron job error:", error.message);
  }
}

function startDomainRefreshJob() {
  cron.schedule("0 3 * * 2,5", async () => {
    console.log("Cron: uruchomiono harmonogram WT/PT 03:00");
    await refreshTopDomains();
  });

  console.log("Cron job ustawiony: wtorki i piątki o 03:00");
}

module.exports = {
  startDomainRefreshJob,
  refreshTopDomains
};