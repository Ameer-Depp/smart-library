const asyncHandler = require("express-async-handler");
const { Borrow, validateBorrow } = require("../models/Borrow");
const { User } = require("../models/User");
const { Book } = require("../models/Book");

const getAllBorrows = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = status ? { status } : {};

  const borrows = await Borrow.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name email")
    .populate("book", "title author");

  res.status(200).json(borrows);
});

const borrowBook = asyncHandler(async (req, res) => {
  const { error } = validateBorrow(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: "user does not exisit" });
  }

  const book = await Book.findById(req.body.book);
  if (!book) {
    return res.status(404).json({ message: "book does not exisit" });
  }
  if (!book.isAvailable) {
    return res.status(404).json({ mesage: "book is not available" });
  }

  const borrow = await Borrow.create({
    user: req.user.userId,
    book: req.body.book,
  });

  book.isAvailable = false;
  await book.save();

  res.status(201).json({
    message: "Book borrowed successfully",
    dueDate: borrow.dueDate,
    borrowId: borrow._id,
    user: {
      name: user.name,
      email: user.email,
    },
    book: {
      "book name": book.title,
    },
  });
});

const returnBook = asyncHandler(async (req, res) => {
  // 1. Find the active borrow record
  const borrow = await Borrow.findOne({
    _id: req.params.id,
    status: "active",
    user: req.user.userId,
  });
  if (!borrow)
    return res.status(404).json({ message: "Active borrow record not found" });

  // 2. Update borrow record
  borrow.returnedAt = new Date();
  borrow.status = "returned";
  await borrow.save();

  // 3. Update book availability
  await Book.findByIdAndUpdate(borrow.book, { isAvailable: true });

  // 4. Return response
  res.status(200).json({
    message: "Book returned successfully",
    borrow,
  });
});

module.exports = { borrowBook, returnBook, getAllBorrows };
