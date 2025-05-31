const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongoDB");
  } catch (error) {
    console.log("failed to connect", error);
    process.exit(1);
  }
};

module.exports = { dbConnection };
