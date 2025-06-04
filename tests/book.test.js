const request = require("supertest");
const express = require("express");
const {
  deleteBook,
  uploadBookCover,
} = require("../controllers/book_controller");
const { Book, validateBook } = require("../models/Book");

jest.mock("../models/Book");

const mockVerifyToken = (req, res, next) => {
  req.user = { userId: "testUserId", isAdmin: true };
  next();
};

const mockIsAdmin = (req, res, next) => {
  if (req.user?.isAdmin) next();
  else res.status(403).json({ message: "Not authorized" });
};

describe("Book Controller", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    app.delete("/books/:id", mockVerifyToken, mockIsAdmin, deleteBook);
    app.patch(
      "/books/:id/upload-cover",
      mockVerifyToken,
      mockIsAdmin,
      uploadBookCover
    );
  });

  describe("DELETE /books/:id", () => {
    it("should delete book successfully", async () => {
      Book.findById.mockResolvedValue({ _id: "bookId" });
      Book.findByIdAndDelete.mockResolvedValue({ _id: "bookId" });

      const response = await request(app).delete("/books/bookId");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Deleted Successfully");
      expect(Book.findByIdAndDelete).toHaveBeenCalledWith("bookId");
    });

    it("should return 404 if book not found", async () => {
      Book.findById.mockResolvedValue(null);

      const response = await request(app).delete("/books/nonexistentId");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("book not found");
    });
  });

  describe("PATCH /books/:id/upload-cover", () => {
    it("should upload book cover successfully", async () => {
      const mockReq = {
        params: { id: "bookId" },
        file: { filename: "cover.jpg" },
      };

      const mockBook = {
        _id: "bookId",
        title: "Test Book",
        coverImage: "/uploads/bookCovers/cover.jpg",
      };

      Book.findByIdAndUpdate.mockResolvedValue(mockBook);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBookCover(mockReq, mockRes);

      expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(
        "bookId",
        { coverImage: "/uploads/bookCovers/cover.jpg" },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Cover image uploaded successfully.",
        coverImage: mockBook.coverImage,
      });
    });

    it("should return 400 if no file uploaded", async () => {
      const mockReq = {
        params: { id: "bookId" },
        file: null,
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBookCover(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No image uploaded.",
      });
    });

    it("should return 404 if book not found", async () => {
      const mockReq = {
        params: { id: "nonexistentId" },
        file: { filename: "cover.jpg" },
      };

      Book.findByIdAndUpdate.mockResolvedValue(null);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBookCover(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Book not found.",
      });
    });
  });
});
