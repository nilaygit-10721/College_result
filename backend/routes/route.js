const express = require("express");
const {
  scrapeMultipleResults,
  getResults,
} = require("../controllers/controller");
const router = express.Router();

router.post("/scrape", scrapeMultipleResults);
router.get("/", getResults);

module.exports = router;
