const express = require("express");
const dotenv = require("dotenv");
const { dbConnection } = require("./configs/db");
const cors = require("cors");
const helmet = require("helmet");

// get envirometn variables
dotenv.config();

const path = require("path");

// database connection
dbConnection();

// create app
const app = express();

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());

// routes
app.use("/api/auth", require("./routes/auth_route"));
app.use("/api/users", require("./routes/user_route"));
app.use("/api/books", require("./routes/book_route"));
app.use("/api/borrows", require("./routes/borrow_route"));

// run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
