import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Alert,
  Badge,
  Spinner,
  Popover,
  OverlayTrigger,
  Modal,
  Card,
} from "react-bootstrap";
import {
  FaDownload,
  FaSearch,
  FaInfoCircle,
  FaUniversity,
  FaUserGraduate,
} from "react-icons/fa";

const Home = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });

  const urlPopover = (
    <Popover id="url-popover">
      <Popover.Header as="h3">URL Format Help</Popover.Header>
      <Popover.Body>
        <p>Enter a complete result URL like:</p>
        <code>https://ums.cvmu.ac.in/GenerateResultHTML/4072/6211001.html</code>
        <hr />
        <p>The system will automatically:</p>
        <ul>
          <li>Extract the base URL pattern</li>
          <li>Determine seat number length</li>
          <li>Generate sequential URLs</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

  // Popover for range help
  const rangePopover = (
    <Popover id="range-popover">
      <Popover.Header as="h3">Seat Number Range</Popover.Header>
      <Popover.Body>
        <p>Enter the starting and ending seat numbers to scan.</p>
        <p>
          <strong>Example:</strong>
        </p>
        <ul>
          <li>Start: 6211001</li>
          <li>End: 6211080</li>
        </ul>
        <p>This will check 80 seat numbers (6211001 to 6211080)</p>
      </Popover.Body>
    </Popover>
  );

  const handleScrape = async () => {
    try {
      setLoading(true);

      // Extract the base URL pattern correctly
      const urlMatch = baseUrl.match(
        /(https:\/\/ums\.cvmu\.ac\.in\/GenerateResultHTML\/\d+\/)/
      );

      if (!urlMatch) {
        alert(
          "Invalid URL format. Please use: https://ums.cvmu.ac.in/GenerateResultHTML/{id}/"
        );
        return;
      }

      const basePath = urlMatch[1]; // The extracted base URL

      // Extract sample seat number from the URL to determine length
      const seatNoMatch = baseUrl.match(/\/(\d+)\.html$/);
      const sampleSeatNo = seatNoMatch ? seatNoMatch[1] : "6211041"; // Default if not found
      const seatNoLength = sampleSeatNo.length; // Typically 7 digits

      const response = await axios.post(
        "https://college-result-yrxi.onrender.com/api/results/scrape",
        {
          baseUrl: basePath,
          start,
          end,
          seatNoLength, // Send the expected seat number length to backend
        }
      );

      console.log("Scraping Results:", response.data);
      setResults(response.data.results || []);
      updateStats(response.data.results || []);
    } catch (error) {
      console.error("Error scraping results:", error);
      alert("Failed to scrape results. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (results) => {
    const passed = results.filter((r) => !r.isFailed).length;
    setStats({
      total: results.length,
      passed,
      failed: results.length - passed,
    });
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.get(
        "https://college-result-yrxi.onrender.com/api/results/download/excel",

        { responseType: "blob" }
      );
      downloadFile(response.data, "results.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download Excel file.");
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get(
        "https://college-result-yrxi.onrender.com/api/results/download/pdf",
        { responseType: "blob" }
      );
      downloadFile(response.data, "results.pdf");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF file.");
    }
  };

  const downloadFile = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const viewDetails = (result) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">
        <FaUniversity className="me-2" />
        University Result Scraper
      </h1>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="baseUrl">
                  <Form.Label>
                    <FaSearch className="me-2" />
                    Base URL
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://ums.cvmu.ac.in/GenerateResultHTML/4072/6211041.html"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Enter a valid result URL to extract the pattern
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="start">
                  <Form.Label>Start Seat No</Form.Label>
                  <Form.Control
                    type="number"
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="end">
                  <Form.Label>End Seat No</Form.Label>
                  <Form.Control
                    type="number"
                    value={end}
                    onChange={(e) => setEnd(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Alert variant="info" className="mt-4">
              <FaInfoCircle className="me-2" />
              <strong>Example Input:</strong>
              <br />
              URL:{" "}
              <code>
                https://ums.cvmu.ac.in/GenerateResultHTML/4072/6211001.html
              </code>
              <br />
              Start: <code>6211001</code>, End: <code>6211080</code>
            </Alert>

            <div className="text-center">
              <Button
                variant="primary"
                onClick={handleScrape}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Scraping...
                  </>
                ) : (
                  "Scrape Results"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {results.length > 0 ? (
        <>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h4>
                  <FaUserGraduate className="me-2" />
                  Results Summary
                </h4>
                <div>
                  <Badge bg="primary" className="me-2">
                    Total: {stats.total}
                  </Badge>
                  <Badge bg="success" className="me-2">
                    Passed: {stats.passed}
                  </Badge>
                  <Badge bg="danger">Failed: {stats.failed}</Badge>
                </div>
              </div>

              <div className="table-responsive">
                <Table striped bordered hover className="mt-3">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Seat No</th>
                      <th>Name</th>
                      <th>College</th>
                      <th>SGPA</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr
                        key={index}
                        className={
                          result.isFailed ? "table-danger" : "table-success"
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{result.seatNo}</td>
                        <td>{result.studentName}</td>
                        <td>{result.collegeName}</td>
                        <td>{result.sgpa}</td>
                        <td>
                          {result.isFailed ? (
                            <Badge bg="danger">FAIL</Badge>
                          ) : (
                            <Badge bg="success">PASS</Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => viewDetails(result)}
                          >
                            <FaInfoCircle className="me-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="text-center mt-4">
                <Button
                  variant="success"
                  onClick={downloadExcel}
                  className="me-3"
                >
                  <FaDownload className="me-2" />
                  Download Excel
                </Button>
                <Button variant="danger" onClick={downloadPDF}>
                  <FaDownload className="me-2" />
                  Download PDF
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      ) : (
        <Alert variant="info" className="mt-4">
          <FaInfoCircle className="me-2" />
          No results available. Enter a URL and click "Scrape Results" to begin.
        </Alert>
      )}

      {/* Result Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Result Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p>
                    <strong>Seat No:</strong> {selectedResult.seatNo}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedResult.studentName}
                  </p>
                  <p>
                    <strong>College:</strong> {selectedResult.collegeName}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>SGPA:</strong> {selectedResult.sgpa}
                  </p>
                  <p>
                    <strong>CGPA:</strong> {selectedResult.cgpa}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedResult.isFailed ? (
                      <Badge bg="danger">FAIL</Badge>
                    ) : (
                      <Badge bg="success">PASS</Badge>
                    )}
                  </p>
                </Col>
              </Row>

              <h5>Course Details</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Grade</th>
                    <th>Points</th>
                    <th>Credits</th>
                    <th>Backlog</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedResult.courses.map((course, index) => (
                    <tr
                      key={index}
                      className={course.backlog ? "table-danger" : ""}
                    >
                      <td>{course.courseCode}</td>
                      <td>{course.courseName}</td>
                      <td>{course.gradeLetter}</td>
                      <td>{course.gradePoint}</td>
                      <td>{course.credit}</td>
                      <td>{course.backlog ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Home;
