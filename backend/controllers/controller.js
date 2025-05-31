const axios = require("axios");
const cheerio = require("cheerio");
const Result = require("../models/model");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Helper function for creating a padded URL
const createPaddedUrl = (baseUrl, number) => {
  const paddedNumber = number.toString().padStart(7, "0"); // Assuming 7-digit seat numbers
  return `${baseUrl}${paddedNumber}.html`;
};

// Function to extract text from a table row by label
const extractValue = ($, label) => {
  return $(`td:contains("${label}")`).next().text().trim();
};

// Function to scrape multiple results with complete data
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
    const maxEmptyResults = 5;

    for (
      let i = start;
      i <= end && consecutiveEmptyResults < maxEmptyResults;
      i++
    ) {
      const url = createPaddedUrl(baseUrl, i);
      console.log(`Scraping URL: ${url}`);

      try {
        const { data } = await axios.get(url, { httpsAgent });
        const $ = cheerio.load(data);

        // Extract basic student info
        const seatNo = $('td:contains("Seat No:")').next().text().trim();
        const studentName = $('td:contains("Student Name:")')
          .next()
          .text()
          .trim();

        // Skip if no basic info found
        if (!seatNo || !studentName) {
          consecutiveEmptyResults++;
          continue;
        }

        // Extract all student data
        const resultData = {
          seatNo,
          examName: $('td:contains("Exam Name:")').next().text().trim(),
          programName: $('td:contains("Program Name:")').next().text().trim(),
          studentName,
          collegeName: $('td:contains("College Name:")').next().text().trim(),
          enrollmentNo: $('td:contains("Enrolment / PG Registration No:")')
            .next()
            .text()
            .trim(),
          resultDate: new Date(
            $('td:contains("Result Declared ON Date :")').next().text().trim()
          ),
          spId: $('td:contains("SP ID:")').next().text().trim(),
          courses: [],
          // Extract SGPA/CGPA from span with class "colum-left"
          sgpa: parseFloat(
            $('span:contains("SGPA :")')
              .parent()
              .text()
              .replace("SGPA :", "")
              .trim()
          ),
          cgpa: parseFloat(
            $('span:contains("CGPA :")')
              .parent()
              .text()
              .replace("CGPA :", "")
              .trim()
          ),
          resultStatus: $('span:contains("Result :")')
            .parent()
            .text()
            .replace("Result :", "")
            .trim(),
          currentBacklogs:
            parseInt(
              $('span:contains("Current Semester Backlogs :")')
                .parent()
                .text()
                .replace("Current Semester Backlogs :", "")
                .trim()
            ) || 0,
        };

        // Extract course details
        $("#mytbl tr:not(.trheader)").each((i, row) => {
          const cols = $(row).find("td");
          if (cols.length >= 5) {
            const gradePointText = cols.eq(3).text().trim();
            resultData.courses.push({
              courseCode: cols.eq(0).text().trim(),
              courseName: cols.eq(1).text().trim(),
              gradeLetter: cols.eq(2).text().trim(),
              gradePoint: gradePointText ? parseInt(gradePointText) : 0,
              credit: parseInt(cols.eq(4).text().trim()) || 0,
              backlog:
                cols.length > 5 ? cols.eq(5).text().trim() !== "" : false,
            });
          }
        });

        // Determine if student failed (check both status and backlogs)
        const hasFailedCourses = resultData.courses.some((c) => c.backlog);
        const hasFailStatus =
          resultData.resultStatus.toLowerCase().includes("fail") ||
          $('span:contains("not cleared")').length > 0;

        resultData.isFailed =
          hasFailedCourses || hasFailStatus || resultData.currentBacklogs > 0;

        // If we got this far, reset empty result counter
        consecutiveEmptyResults = 0;
        results.push(resultData);
      } catch (error) {
        console.error(`Error scraping URL ${url}:`, error.message);
        consecutiveEmptyResults++;
      }
    }

    if (results.length > 0) {
      try {
        // Delete existing results to avoid duplicates
        await Result.deleteMany({});

        const savedResults = await Result.insertMany(results);

        // Calculate pass/fail counts properly
        const passedCount = savedResults.filter((r) => !r.isFailed).length;
        const failedCount = savedResults.length - passedCount;

        return res.status(201).json({
          message: "Scraping completed successfully",
          totalScraped: savedResults.length,
          passed: passedCount,
          failed: failedCount,
          results: savedResults,
        });
      } catch (dbError) {
        console.error("Database error:", dbError.message);
        return res.status(500).json({
          message: "Error saving results to database",
          error: dbError.message,
          scrapedResults: results,
        });
      }
    } else {
      return res.status(404).json({
        message: "No valid student data found",
      });
    }
  } catch (error) {
    console.error("Error during scraping:", error.message);
    res.status(500).json({
      message: "Internal server error during scraping",
      error: error.message,
    });
  }
};

// Enhanced getResults with filtering
const getResults = async (req, res) => {
  try {
    const { status, sortBy, limit } = req.query;
    let query = {};

    // Add status filter if provided
    if (status === "passed") {
      query.isFailed = false;
    } else if (status === "failed") {
      query.isFailed = true;
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      const [field, order] = sortBy.split(":");
      sort[field] = order === "desc" ? -1 : 1;
    } else {
      sort = { studentName: 1 }; // Default sort by name
    }

    // Execute query
    let resultsQuery = Result.find(query).sort(sort);
    if (limit) resultsQuery = resultsQuery.limit(parseInt(limit));

    const results = await resultsQuery.exec();

    res.status(200).json({
      count: results.length,
      passed: results.filter((r) => !r.isFailed).length,
      failed: results.filter((r) => r.isFailed).length,
      results,
    });
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res.status(500).json({
      message: "Internal server error while fetching results",
      error: error.message,
    });
  }
};

// Enhanced Excel download with all fields
const downloadExcel = async (req, res) => {
  try {
    const results = await Result.find().lean();

    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No data available for download" });
    }

    const workbook = XLSX.utils.book_new();

    // Main results sheet
    const mainData = [
      [
        "Seat No",
        "Name",
        "College",
        "Program",
        "SGPA",
        "CGPA",
        "Status",
        "Backlogs",
      ],
    ];

    results.forEach((result) => {
      mainData.push([
        result.seatNo,
        result.studentName,
        result.collegeName,
        result.programName,
        result.sgpa,
        result.cgpa,
        result.isFailed ? "FAIL" : "PASS",
        result.currentBacklogs,
      ]);
    });

    const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, "Results Summary");

    // Course details sheet
    if (results[0].courses) {
      const courseData = [
        [
          "Seat No",
          "Name",
          "Course Code",
          "Course Name",
          "Grade",
          "Credits",
          "Backlog",
        ],
      ];

      results.forEach((result) => {
        result.courses.forEach((course) => {
          courseData.push([
            result.seatNo,
            result.studentName,
            course.courseCode,
            course.courseName,
            course.gradeLetter,
            course.credit,
            course.backlog ? "Yes" : "No",
          ]);
        });
      });

      const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
      XLSX.utils.book_append_sheet(workbook, courseSheet, "Course Details");
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error.message);
    res.status(500).json({
      message: "Internal server error while generating Excel file",
      error: error.message,
    });
  }
};

// Enhanced PDF download with all fields
const downloadPDF = async (req, res) => {
  try {
    const results = await Result.find().lean();

    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No data available for download" });
    }

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Disposition", "attachment; filename=results.pdf");
    res.setHeader("Content-Type", "application/pdf");

    // Title
    doc.fontSize(18).text("Student Results", { align: "center" });
    doc.moveDown();

    // Summary info
    doc
      .fontSize(12)
      .text(`Total Students: ${results.length}`, { align: "left" })
      .text(`Passed: ${results.filter((r) => !r.isFailed).length}`, {
        align: "right",
      })
      .text(`Failed: ${results.filter((r) => r.isFailed).length}`, {
        align: "right",
      });
    doc.moveDown(2);

    // Main table header
    doc
      .font("Helvetica-Bold")
      .text("Seat No", 50, doc.y, { width: 70 })
      .text("Name", 120, doc.y, { width: 150 })
      .text("College", 270, doc.y, { width: 150 })
      .text("SGPA", 420, doc.y, { width: 50, align: "right" })
      .text("Status", 470, doc.y, { width: 50, align: "right" });
    doc.moveDown();

    // Main table content
    doc.font("Helvetica");
    results.forEach((result) => {
      doc
        .fillColor(result.isFailed ? "red" : "black")
        .text(result.seatNo, 50, doc.y, { width: 70 })
        .text(result.studentName, 120, doc.y, { width: 150 })
        .text(result.collegeName, 270, doc.y, { width: 150 })
        .text(result.sgpa.toString(), 420, doc.y, { width: 50, align: "right" })
        .text(result.isFailed ? "FAIL" : "PASS", 470, doc.y, {
          width: 50,
          align: "right",
        });
      doc.moveDown();
      doc.fillColor("black"); // Reset color
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF file:", error.message);
    res.status(500).json({
      message: "Internal server error while generating PDF file",
      error: error.message,
    });
  }
};

module.exports = {
  scrapeMultipleResults,
  getResults,
  downloadExcel,
  downloadPDF,
};
