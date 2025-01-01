const axios = require("axios");
const cheerio = require("cheerio");
const Result = require("../models/model");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// Scrape multiple results
const scrapeMultipleResults = async (req, res) => {
  try {
    const { baseUrl, start, end } = req.body;

    // Validate input
    if (!baseUrl || start == null || end == null) {
      return res
        .status(400)
        .json({ message: "Base URL, start, and end values are required" });
    }

    const results = [];
    let consecutiveEmptyResults = 0;
    const maxEmptyResults = 1;

    for (let i = start; i <= end; i++) {
      if (consecutiveEmptyResults >= maxEmptyResults) {
        console.log(
          "Stopping the scraping process due to consecutive empty results."
        );
        break;
      }

      const paddedNumber = i.toString().padStart(2, "0");
      const url = `${baseUrl}${paddedNumber}.html`;

      console.log(`Scraping URL: ${url}`);

      try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const name = $("tr.background1 td").eq(8).text().trim();
        const sgpa = $("tr.background1 td").eq(17).text().trim();

        if (name && sgpa) {
          const studentData = { name, sgpa };
          results.push(studentData);
          consecutiveEmptyResults = 0;
        } else {
          consecutiveEmptyResults++;
        }
      } catch (error) {
        console.error(
          `Error occurred while scraping data from URL: ${url}`,
          error
        );
        consecutiveEmptyResults++;
      }
    }

    if (results.length > 0) {
      const savedResults = await Result.insertMany(results);
      res.json(savedResults);
    } else {
      res.status(404).json({ message: "No valid student data found" });
    }
  } catch (error) {
    console.error("Error occurred while scraping data:", error);
    res.status(500).send("Error occurred while scraping");
  }
};

// Fetch all results
const getResults = async (req, res) => {
  try {
    const results = await Result.find();
    res.json(results);
  } catch (error) {
    console.error("Error occurred while fetching results:", error);
    res.status(500).send("Error occurred while fetching results");
  }
};

// Generate Excel file
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

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=results.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).send("Error generating Excel file");
  }
};

// Generate PDF file
const downloadPDF = async (req, res) => {
  try {
    const results = await Result.find();

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No data available for download" });
    }

    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=results.pdf"
    );
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
    console.error("Error generating PDF file:", error);
    res.status(500).send("Error generating PDF file");
  }
};

// Export all functions
module.exports = {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
};
