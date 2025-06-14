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
/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books (public)
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of books
 */
router.get("/", getBooks);

/**
 * @swagger
 * /api/books/{id}/upload-cover:
 *   patch:
 *     summary: Upload a cover image for a book (admin only)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover uploaded
 */
router.patch(
  "/:id/upload-cover",
  verifyToken,
  isAdmin,
  upload.single("cover"),
  uploadBookCover
);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book (admin only)
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, ISBN, category]
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               ISBN:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book created
 */
router.post("/", verifyToken, isAdmin, createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book (admin only)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Book updated
 */
router.put("/:id", verifyToken, isAdmin, updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book (admin only)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted
 */
router.delete("/:id", verifyToken, isAdmin, deleteBook);

module.exports = router;
