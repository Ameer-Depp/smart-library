const asyncHandler = require("express-async-handler");
const { Book, validateBook } = require("../models/Book");

// get all books
const getBooks = asyncHandler(async (req, res) => {
  // Step 1: Extract query parameters
  const {
    title,
    author,
    category,
    isAvailable,
    page = 1, // Default: page 1
    limit = 10, // Default: 10 books per page
  } = req.query;

  // Step 2: Build the filter object
  const filter = {};
  if (title) filter.title = { $regex: title, $options: "i" }; // Case-insensitive search
  if (author) filter.author = { $regex: author, $options: "i" };
  if (category) filter.category = category;
  if (isAvailable) filter.isAvailable = isAvailable === "true";

  // Step 3: Pagination logic
  const startIndex = (page - 1) * limit;
  const totalBooks = await Book.countDocuments(filter);

  // Step 4: Fetch paginated + filtered books
  const books = await Book.find(filter)
    .skip(startIndex)
    .limit(limit)
    .populate("addedBy", "name email"); // Optional: Include addedBy user details

  // Step 5: Send response with metadata
  res.status(200).json({
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalBooks / limit),
    totalBooks,
    books,
  });
});

// create a book
const createBook = asyncHandler(async (req, res) => {
  const { error } = validateBook(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const newBook = await Book.create({
    title: req.body.title,
    author: req.body.author,
    ISBN: req.body.ISBN,
    category: req.body.category,
    addedBy: req.user.userId,
  });

  res.status(200).json(newBook);
});

// update book
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404).json({ message: "book not found" });
  }
  const { error } = validateBook(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        author: req.body.author,
        ISBN: req.body.ISBN,
        category: req.body.category,
        coverImage: req.body.coverImage,
        isAvailable: req.body.isAvailable,
      },
    },
    { new: true }
  );
  res.status(201).json(updatedBook);
});

// delete book
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "book not found" });
  }
  await Book.findByIdAndDelete(req.params.id);
  return res.status(200).json({ message: "Deleted Successfully" });
});
module.exports = { createBook, updateBook, getBooks, deleteBook };
