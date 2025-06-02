const mongoose = require("mongoose");
const Joi = require("joi");

// 1. Define Mongoose Schema
const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    ISBN: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Fiction", "Non-Fiction", "Science", "History", "Biography"],
      default: "Fiction",
    },
    coverImage: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 2. Add Joi Validation
function validateBook(book) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(100).required(),
    author: Joi.string().min(2).max(50).required(),
    ISBN: Joi.string()
      .length(13)
      .pattern(/^[0-9]+$/)
      .required(),
    category: Joi.string().valid(
      "Fiction",
      "Non-Fiction",
      "Science",
      "History",
      "Biography"
    ),
    coverImage: Joi.string().uri(),
    isAvailable: Joi.boolean(),
  });
  return schema.validate(book);
}

const Book = mongoose.model("Book", BookSchema);

module.exports = { Book, validateBook };
