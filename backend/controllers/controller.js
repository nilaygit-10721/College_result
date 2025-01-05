const axios = require("axios");
const cheerio = require("cheerio");
const Result = require("../models/model");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

// Scrape multiple results
const scrapeMultipleResults = async (req, res) => {
  try {
    const { baseUrl, start, end } = req.body;

    // Validate input
    if (!baseUrl || start == null || end == null) {
      return res.status(400).json({
        message: "Base URL, start, and end values are required",
      });
    }

    const results = [];
    let consecutiveEmptyResults = 0;
    const maxEmptyResults = 3; // Retry threshold for empty results

    for (let i = start; i <= end; i++) {
      if (consecutiveEmptyResults >= maxEmptyResults) {
        console.log("Stopping due to consecutive empty results.");
        break;
      }

      const paddedNumber = i.toString().padStart(2, "0");
      const url = `${baseUrl}${paddedNumber}.html`;

      console.log(`Scraping URL: ${url}`);

      try {
        // Set headers to mimic a browser request
        const { data } = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        const $ = cheerio.load(data);
        const name = $("tr.background1 td").eq(8).text().trim();
        const sgpa = $("tr.background1 td").eq(17).text().trim();

        if (name && sgpa) {
          results.push({ name, sgpa });
          consecutiveEmptyResults = 0;
        } else {
          consecutiveEmptyResults++;
        }
      } catch (error) {
        console.error(`Error scraping URL: ${url}`, error.message);

        // Retry mechanism for network errors
        if (error.code === "ERR_NETWORK" || error.response?.status >= 500) {
          console.warn(`Retrying URL: ${url}`);
          consecutiveEmptyResults++;
        }
      }
    }

    if (results.length > 0) {
      const savedResults = await Result.insertMany(results);
      res.json(savedResults);
    } else {
      res.status(404).json({ message: "No valid student data found" });
    }
  } catch (error) {
    console.error("Scraping error:", error.message);
    res.status(500).json({ message: "Internal server error during scraping" });
  }
};

// Other functions remain unchanged

module.exports = {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
};
