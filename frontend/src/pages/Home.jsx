import React, { useState } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Button, Table, Alert } from "react-bootstrap";

const Home = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [results, setResults] = useState([]);

  const handleScrape = async () => {
    try {
      // Extract and modify the URL
      const match = baseUrl.match(/(https:\/\/ums\.cvmu\.ac\.in\/GenerateResultHTML\/\d+\/\d{5})/);
      if (!match) {
        console.error("Invalid URL format. Please provide a valid URL.");
        alert("Invalid URL. Please ensure it follows the format: https://ums.cvmu.ac.in/GenerateResultHTML/{id}/{number}.html");
        return;
      }
  
      const trimmedUrl = match[0]; // Extracted trimmed URL
  
      const response = await axios.post("https://college-result-yrxi.onrender.com/api/results/scrape", {
        baseUrl: trimmedUrl,
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
      const response = await axios.get("https://college-result-yrxi.onrender.com/api/results/download/excel", {
        responseType: "blob",
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
      const response = await axios.get("https://college-result-yrxi.onrender.com/api/results/download/pdf", {
        responseType: "blob",
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
    <Container className="my-5">
      <h1 className="text-center mb-4">Result Scraper</h1>
      <Form>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="baseUrl">
              <Form.Label>Base URL</Form.Label>
              <Form.Control
  type="text"
  placeholder="Enter the URL (e.g., https://ums.cvmu.ac.in/GenerateResultHTML/2877/4211082.html)"
  value={baseUrl}
  onChange={(e) => setBaseUrl(e.target.value)}
/>

            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="start">
              <Form.Label>Start</Form.Label>
              <Form.Control
                type="number"
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="end">
              <Form.Label>End</Form.Label>
              <Form.Control
                type="number"
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
              />
            </Form.Group>
          </Col>
        </Row>
        <div className="text-center">
          <Button variant="primary" onClick={handleScrape}>
            Scrape Results
          </Button>
        </div>
      </Form>

      <hr />

      {results.length > 0 ? (
        <>
          <h2 className="mt-4">Scraped Results</h2>
          <Table striped bordered hover className="mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>SGPA</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{result.name}</td>
                  <td>{result.sgpa}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="text-center mt-4">
            <Button variant="success" onClick={downloadExcel} className="me-2">
              Download Excel
            </Button>
            <Button variant="danger" onClick={downloadPDF}>
              Download PDF
            </Button>
          </div>
        </>
      ) : (
        <Alert variant="info" className="mt-4">
          No results available. Start scraping to see data.
        </Alert>
      )}
    </Container>
  );
};

export default Home;
