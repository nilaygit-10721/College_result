const express = require("express");
const {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
} = require("../controllers/controller");
const router = express.Router();

router.post("/scrape", scrapeMultipleResults);
router.get("/", getResults);
router.get("/download/excel",downloadExcel);
router.get("/download/pdf",downloadPDF);

module.exports = router;
