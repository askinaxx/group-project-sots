const express = require("express");
const { getDomainByName } = require("../controllers/domainController");

const router = express.Router();

router.get("/:name", getDomainByName);

module.exports = router;