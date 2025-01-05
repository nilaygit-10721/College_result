const axios = require("axios");
const cheerio = require("cheerio");
const Result = require("../models/model");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

// Helper function for creating a padded URL
const createPaddedUrl = (baseUrl, number) => {
  const paddedNumber = number.toString().padStart(2, "0");
  return `${baseUrl}${paddedNumber}.html`;
};

// Function to scrape multiple results
const scrapeMultipleResults = async (req, res) => {
  try {
    const { baseUrl, start, end } = req.body;

    // Validate input
    if (!baseUrl || start == null || end == null) {
      return res.status(400).json({ message: "Base URL, start, and end values are required" });
    }

    const results = [];
    let consecutiveEmptyResults = 0;
    const maxEmptyResults = 1; // Stop after 1 consecutive empty result

    for (let i = start; i <= end; i++) {
      if (consecutiveEmptyResults >= maxEmptyResults) {
        console.log("Stopping scraping due to consecutive empty results.");
        break;
      }

      const url = createPaddedUrl(baseUrl, i);
      console.log(`Scraping URL: ${url}`);

      try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract name and SGPA
        const name = $("tr.background1 td").eq(8).text().trim();
        const sgpa = $("tr.background1 td").eq(17).text().trim();

        if (name && sgpa) {
          results.push({ name, sgpa });
          consecutiveEmptyResults = 0;
        } else {
          consecutiveEmptyResults++;
        }
      } catch (error) {
        console.error(`Error scraping URL ${url}:`, error.message);
        consecutiveEmptyResults++;
      }
    }

    if (results.length > 0) {
      const savedResults = await Result.insertMany(results);
      return res.status(201).json(savedResults);
    } else {
      return res.status(404).json({ message: "No valid student data found" });
    }
  } catch (error) {
    console.error("Error during scraping:", error.message);
    res.status(500).send("Internal server error during scraping");
  }
};

// Function to fetch all results
const getResults = async (req, res) => {
  try {
    const results = await Result.find();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res.status(500).send("Internal server error while fetching results");
  }
};

// Function to generate and download Excel file
const downloadExcel = async (req, res) => {
  try {
    const results = await Result.find();

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No data available for download" });
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData = [["Name", "SGPA"]]; // Header row
    results.forEach((result) => worksheetData.push([result.name, result.sgpa]));
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error.message);
    res.status(500).send("Internal server error while generating Excel file");
  }
};

// Function to generate and download PDF file
const downloadPDF = async (req, res) => {
  try {
    const results = await Result.find();

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No data available for download" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", "attachment; filename=results.pdf");
    res.setHeader("Content-Type", "application/pdf");

    doc.fontSize(18).text("Results", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text("Name", { continued: true }).text("SGPA", { align: "right" });
    doc.moveDown();

    results.forEach((result) => {
      doc.text(result.name, { continued: true }).text(result.sgpa, { align: "right" });
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF file:", error.message);
    res.status(500).send("Internal server error while generating PDF file");
  }
};

// Export all functions
module.exports = {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
};
