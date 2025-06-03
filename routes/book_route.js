const express = require("express");
const {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
  uploadBookCover,
} = require("../controllers/book_controller");
const upload = require("../middlewares/uploads");
const { verifyToken, isAdmin } = require("../middlewares/verification");
const router = express.Router();

// Public routes
router.get("/", getBooks); // Filter by title/author/category

// PATCH /books/:id/cover
router.patch(
  "/:id/upload-cover",
  verifyToken,
  isAdmin,
  upload.single("cover"),
  uploadBookCover
);

// Admin-only routes
router.post("/", verifyToken, isAdmin, createBook);
router.put("/:id", verifyToken, isAdmin, updateBook);
router.delete("/:id", verifyToken, isAdmin, deleteBook);

module.exports = router;
