const express = require("express");
const {
  borrowBook,
  returnBook,
  getAllBorrows,
} = require("../controllers/borrow_controller");
const { verifyToken, isAdmin } = require("../middlewares/verification");
const router = express.Router();

/**
 * @swagger
 * /api/borrows:
 *   get:
 *     summary: Get all borrow records (admin only)
 *     tags: [Borrows]
 *     responses:
 *       200:
 *         description: Borrow list
 */
router.get("/", verifyToken, isAdmin, getAllBorrows);

/**
 * @swagger
 * /api/borrows:
 *   post:
 *     summary: Borrow a book
 *     tags: [Borrows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [book]
 *             properties:
 *               book:
 *                 type: string
 *     responses:
 *       201:
 *         description: Borrow created
 */
router.post("/", verifyToken, borrowBook);

/**
 * @swagger
 * /api/borrows/{id}/return:
 *   patch:
 *     summary: Return a borrowed book
 *     tags: [Borrows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book returned
 */
router.patch("/:id/return", verifyToken, returnBook);

module.exports = router;
