const express = require("express");
const {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
} = require("../controllers/controller");
const router = express.Router();

// Scrape results with complete data
router.post("/scrape", scrapeMultipleResults);

// Get results with filtering options
// Example queries:
// /results?status=passed&sortBy=sgpa:desc&limit=10
// /results?status=failed
// /results?sortBy=studentName:asc
router.get("/", getResults);

// Download options
router.get("/download/excel", downloadExcel);
router.get("/download/pdf", downloadPDF);

module.exports = router;
