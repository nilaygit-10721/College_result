const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sgpa: {
    type: String,
    required: true,
  },
});

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
