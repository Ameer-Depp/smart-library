const express = require("express");
const {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
} = require("../controllers/book_controller");
const { verifyToken, isAdmin } = require("../middlewares/verification");
const router = express.Router();

// Public routes
router.get("/", getBooks); // Filter by title/author/category

// Admin-only routes
router.post("/", verifyToken, isAdmin, createBook);
router.put("/:id", verifyToken, isAdmin, updateBook);
router.delete("/:id", verifyToken, isAdmin, deleteBook);

module.exports = router;
