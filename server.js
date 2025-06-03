const express = require("express");
const dotenv = require("dotenv");
const { dbConnection } = require("./configs/db");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// get envirometn variables
dotenv.config();

const path = require("path");

// database connection
dbConnection();

// create app
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Logging
app.use(morgan("dev"));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middlewares
app.use(mongoSanitize());
app.use(express.json());
app.use(helmet());
app.use(cors());

// routes
app.use("/api/auth", require("./routes/auth_route"));
app.use("/api/users", require("./routes/user_route"));
app.use("/api/books", require("./routes/book_route"));
app.use("/api/borrows", require("./routes/borrow_route"));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
