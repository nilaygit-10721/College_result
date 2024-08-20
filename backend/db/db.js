const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const dbconnect = async () => {
  await mongoose
    .connect(process.env.mongo)
    .then(() => console.log("MONGO connected!"))
    .catch((err) => console.log(err));
};

module.exports = dbconnect;
