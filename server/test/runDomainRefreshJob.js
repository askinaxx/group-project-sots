require("dotenv").config();
const { refreshTopDomains } = require("../jobs/domainRefreshJob");

async function runTest() {
  console.log("Test cron joba: start");
  await refreshTopDomains();
  console.log("Test cron joba: koniec");
  process.exit(0);
}

runTest();