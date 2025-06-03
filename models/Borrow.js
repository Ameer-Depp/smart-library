const mongoose = require("mongoose");
const Joi = require("joi");

// 1. Mongoose Schema
const BorrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days later
    },
    status: {
      type: String,
      enum: ["active", "returned", "overdue"],
      default: "active",
    },
  },
  { timestamps: true } // Adds createdAt, updatedAt
);

// 2. Joi Validation
function validateBorrow(borrow) {
  const schema = Joi.object({
    book: Joi.string().hex().length(24).required(),
    returnedAt: Joi.date().optional(),
  });
  return schema.validate(borrow);
}

const Borrow = mongoose.model("Borrow", BorrowSchema);

module.exports = { Borrow, validateBorrow };
