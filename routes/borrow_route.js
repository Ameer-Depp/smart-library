const express = require("express");
const {
  borrowBook,
  returnBook,
  getAllBorrows,
} = require("../controllers/borrow_controller");
const { verifyToken, isAdmin } = require("../middlewares/verification");
const router = express.Router();

router.get("/", verifyToken, isAdmin, getAllBorrows);
router.post("/", verifyToken, borrowBook);
router.patch("/:id/return", verifyToken, returnBook);

module.exports = router;
