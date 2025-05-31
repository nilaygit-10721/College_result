const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseCode: String,
  courseName: String,
  gradeLetter: String,
  gradePoint: Number,
  credit: Number,
  backlog: Boolean,
});

const resultSchema = new mongoose.Schema({
  seatNo: String,
  examName: String,
  programName: String,
  studentName: String,
  collegeName: String,
  enrollmentNo: String,
  resultDate: Date,
  spId: String,
  courses: [courseSchema],
  sgpa: Number,
  cgpa: Number,
  resultStatus: String, // PASS/FAIL
  currentBacklogs: Number,
  isFailed: Boolean,
  scrapedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Result", resultSchema);
