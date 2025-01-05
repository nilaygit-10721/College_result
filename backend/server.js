const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db/db");
const resultRoutes = require("./routes/route");

dotenv.config();

// Initialize database connection
connectDB();

const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Use environment variable for flexibility
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use("/api/results", resultRoutes);

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
