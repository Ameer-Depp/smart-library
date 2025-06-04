const request = require("supertest");
const express = require("express");
const {
  borrowBook,
  returnBook,
  getAllBorrows,
} = require("../controllers/borrow_controller");
const { Borrow, validateBorrow } = require("../models/Borrow");
const { User } = require("../models/User");
const { Book } = require("../models/Book");

jest.mock("../models/Borrow");
jest.mock("../models/User");
jest.mock("../models/Book");

const mockVerifyToken = (req, res, next) => {
  req.user = { userId: "testUserId" };
  next();
};

const mockIsAdmin = (req, res, next) => next();

describe("Borrow Controller", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    app.get("/borrows", mockVerifyToken, mockIsAdmin, getAllBorrows);
    app.post("/borrows", mockVerifyToken, borrowBook);
    app.patch("/borrows/:id/return", mockVerifyToken, returnBook);
  });

  describe("GET /borrows", () => {
    const mockBorrows = [
      {
        _id: "borrow1",
        user: { name: "John Doe", email: "john@example.com" },
        book: { title: "Test Book 1", author: "Author 1" },
        status: "active",
        borrowedAt: new Date("2025-06-04T15:36:32.582Z").toISOString(),
        dueDate: new Date("2025-06-04T15:36:32.582Z").toISOString(),
      },
      {
        _id: "borrow2",
        user: { name: "Jane Smith", email: "jane@example.com" },
        book: { title: "Test Book 2", author: "Author 2" },
        status: "returned",
        borrowedAt: new Date("2025-06-04T15:36:32.582Z").toISOString(),
        dueDate: new Date("2025-06-04T15:36:32.582Z").toISOString(),
        returnedAt: new Date("2025-06-04T15:36:32.582Z").toISOString(),
      },
    ];

    it("should get all borrows with default pagination", async () => {
      Borrow.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest
          .fn()
          .mockReturnThis()
          .mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBorrows),
          }),
      });

      const response = await request(app).get("/borrows");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBorrows);
      expect(Borrow.find).toHaveBeenCalledWith({});
    });

    it("should filter borrows by status", async () => {
      const activeBorrows = [mockBorrows[0]];

      Borrow.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest
          .fn()
          .mockReturnThis()
          .mockReturnValue({
            populate: jest.fn().mockResolvedValue(activeBorrows),
          }),
      });

      const response = await request(app)
        .get("/borrows")
        .query({ status: "active" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(activeBorrows);
      expect(Borrow.find).toHaveBeenCalledWith({ status: "active" });
    });
  });

  describe("POST /borrows", () => {
    const borrowData = { book: "bookId123" };

    const mockUser = {
      _id: "testUserId",
      name: "John Doe",
      email: "john@example.com",
    };

    const mockBook = {
      _id: "bookId123",
      title: "Test Book",
      author: "Test Author",
      isAvailable: true,
      save: jest.fn(),
    };

    const mockBorrow = {
      _id: "borrowId123",
      user: "testUserId",
      book: "bookId123",
      dueDate: new Date(),
      status: "active",
    };

    it("should borrow book successfully", async () => {
      validateBorrow.mockReturnValue({ error: null });
      User.findById.mockResolvedValue(mockUser);
      Book.findById.mockResolvedValue(mockBook);
      Borrow.create.mockResolvedValue(mockBorrow);

      const response = await request(app).post("/borrows").send(borrowData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Book borrowed successfully");
      expect(response.body.borrowId).toBe(mockBorrow._id);
      expect(response.body.user.name).toBe(mockUser.name);
      expect(response.body.book["book name"]).toBe(mockBook.title);
      expect(mockBook.isAvailable).toBe(false);
      expect(mockBook.save).toHaveBeenCalled();
    });

    it("should return 400 for invalid borrow data", async () => {
      validateBorrow.mockReturnValue({
        error: { details: [{ message: "Book ID is required" }] },
      });

      const response = await request(app).post("/borrows").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Book ID is required");
    });

    it("should return 404 if user does not exist", async () => {
      validateBorrow.mockReturnValue({ error: null });
      User.findById.mockResolvedValue(null);

      const response = await request(app).post("/borrows").send(borrowData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("user does not exisit");
    });

    it("should return 404 if book does not exist", async () => {
      validateBorrow.mockReturnValue({ error: null });
      User.findById.mockResolvedValue(mockUser);
      Book.findById.mockResolvedValue(null);

      const response = await request(app).post("/borrows").send(borrowData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("book does not exisit");
    });

    it("should return 404 if book is not available", async () => {
      validateBorrow.mockReturnValue({ error: null });
      User.findById.mockResolvedValue(mockUser);
      Book.findById.mockResolvedValue({
        ...mockBook,
        isAvailable: false,
      });

      const response = await request(app).post("/borrows").send(borrowData);

      expect(response.status).toBe(404);
      expect(response.body.mesage).toBe("book is not available");
    });
  });

  describe("PATCH /borrows/:id/return", () => {
    const mockBorrow = {
      _id: "borrowId123",
      user: "testUserId",
      book: "bookId123",
      status: "active",
      returnedAt: null,
      save: jest.fn(),
    };

    it("should return book successfully", async () => {
      Borrow.findOne.mockResolvedValue(mockBorrow);
      Book.findByIdAndUpdate.mockResolvedValue({});

      const response = await request(app).patch("/borrows/borrowId123/return");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Book returned successfully");
      expect(mockBorrow.status).toBe("returned");
      expect(mockBorrow.returnedAt).toBeInstanceOf(Date);
      expect(mockBorrow.save).toHaveBeenCalled();
      expect(Book.findByIdAndUpdate).toHaveBeenCalledWith(mockBorrow.book, {
        isAvailable: true,
      });
    });

    it("should return 404 if active borrow record not found", async () => {
      Borrow.findOne.mockResolvedValue(null);

      const response = await request(app).patch(
        "/borrows/nonexistentId/return"
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Active borrow record not found");
    });

    it("should find borrow with correct criteria", async () => {
      Borrow.findOne.mockResolvedValue(mockBorrow);
      Book.findByIdAndUpdate.mockResolvedValue({});

      await request(app).patch("/borrows/borrowId123/return");

      expect(Borrow.findOne).toHaveBeenCalledWith({
        _id: "borrowId123",
        status: "active",
        user: "testUserId",
      });
    });
  });
});
