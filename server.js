const express = require("express");
const dotenv = require("dotenv");
const { dbConnection } = require("./configs/db");

// get envirometn variables
dotenv.config();

// database connection
dbConnection();

// create app
const app = express();

// parse to json format
app.use(express.json());

// run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
