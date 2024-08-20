const axios = require("axios");
const cheerio = require("cheerio");
const Result = require("../models/model");

const scrapeMultipleResults = async (req, res) => {
  try {
    const { baseUrl, start, end } = req.body;

    if (!baseUrl || start == null || end == null) {
      return res
        .status(400)
        .json({ message: "Base URL, start, and end values are required" });
    }

    const results = [];

    for (let i = start; i <= end; i++) {
      const paddedNumber = i.toString().padStart(2, "0");
      const url = `https://ums.cvmu.ac.in/GenerateResultHTML/2877/42110${paddedNumber}.html`;

      console.log(`Scraping URL: ${url}`);

      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const name = $("tr.background1 td").eq(8).text().trim();
      const sgpa = $("tr.background1 td").eq(17).text().trim();

      if (name && sgpa) {
        const studentData = { name, sgpa };
        results.push(studentData);
      }
    }

    const savedResults = await Result.insertMany(results);

    res.json(savedResults);
  } catch (error) {
    console.error("Error occurred while scraping data from URL:", error);
    res.status(500).send("Error occurred while scraping");
  }
};

const getResults = async (req, res) => {
  try {
    const results = await Result.find();
    res.json(results);
  } catch (error) {
    console.error("Error occurred while fetching results:", error);
    res.status(500).send("Error occurred while fetching results");
  }
};

module.exports = { scrapeMultipleResults, getResults };
