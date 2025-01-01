import React, { useState } from "react";
import axios from "axios";

const Home = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [results, setResults] = useState([]);

  const handleScrape = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/results/scrape", {
        baseUrl,
        start,
        end,
      });
      console.log("Scraping Results:", response.data);
      setResults(response.data); // Update state with results
    } catch (error) {
      console.error("Error scraping results:", error);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/results/download/excel", {
        responseType: "blob", // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/results/download/pdf", {
        responseType: "blob", // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading PDF file:", error);
    }
  };

  return (
    <div>
      <h1>Result Scraper</h1>
      <input
        type="text"
        placeholder="Enter Base URL"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
      />
      <input
        type="number"
        placeholder="Start"
        value={start}
        onChange={(e) => setStart(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="End"
        value={end}
        onChange={(e) => setEnd(Number(e.target.value))}
      />
      <button onClick={handleScrape}>Scrape Results</button>

      <h2>Scraped Results</h2>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            {result.name} - {result.sgpa}
          </li>
        ))}
      </ul>

      {results.length > 0 && (
        <div>
          <button onClick={downloadExcel}>Download Excel</button>
          <button onClick={downloadPDF}>Download PDF</button>
        </div>
      )}
    </div>
  );
};

export default Home;
