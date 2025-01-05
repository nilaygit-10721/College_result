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
app.use(cors({ origin: "https://college-result-mu.vercel.app/" })); // Replace with your frontend domain
app.use(express.json());

// API Routes
app.use("/api/results", resultRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
