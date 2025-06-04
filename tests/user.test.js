const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const {
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
} = require("../controllers/user_controller");
const { User, UserRegisterValidation } = require("../models/User");

jest.mock("../models/User");
jest.mock("bcrypt");

const mockVerifyToken = (req, res, next) => {
  req.user = { userId: "testUserId" };
  next();
};

const mockIsAdmin = (req, res, next) => next();
const mockVerifyTokenAndAuthorization = (req, res, next) => next();

describe("User Controller", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    app.get("/users", mockVerifyToken, mockIsAdmin, getAllUsers);
    app.get(
      "/users/:id",
      mockVerifyToken,
      mockVerifyTokenAndAuthorization,
      getOneUser
    );
    app.put(
      "/users/:id",
      mockVerifyToken,
      mockVerifyTokenAndAuthorization,
      updateUser
    );
    app.delete(
      "/users/:id",
      mockVerifyToken,
      mockVerifyTokenAndAuthorization,
      deleteUser
    );
  });

  describe("GET /users", () => {
    const mockUsers = [
      {
        _id: "user1",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isAdmin: false,
      },
      {
        _id: "user2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "admin",
        isAdmin: true,
      },
    ];

    it("should get all users successfully", async () => {
      User.find.mockResolvedValue(mockUsers);

      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
    });

    it("should handle empty user list", async () => {
      User.find.mockResolvedValue([]);

      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /users/:id", () => {
    const mockUser = {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      isAdmin: false,
    };

    it("should get one user successfully", async () => {
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get("/users/user1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get("/users/nonexistentId");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("user not found");
    });
  });

  describe("PUT /users/:id", () => {
    const updateData = {
      name: "Updated Name",
      email: "updated@example.com",
      password: "newPassword123",
    };

    const mockUser = {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
    };

    it("should update user successfully", async () => {
      // Fix here: mockReturnValue (sync validation)
      UserRegisterValidation.mockReturnValue({ error: null });

      User.findById.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.findByIdAndUpdate.mockResolvedValue({
        _id: "user1",
        ...updateData,
        password: "hashedPassword",
      });

      const response = await request(app).put("/users/user1").send(updateData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(updateData.password, "salt");
    });

    it("should return 400 for invalid user data", async () => {
      // Fix here: mockReturnValue (sync validation)
      UserRegisterValidation.mockReturnValue({
        error: { details: [{ message: "Invalid email format" }] },
      });

      const response = await request(app)
        .put("/users/user1")
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid email format");
    });

    it("should return 404 if user not found", async () => {
      UserRegisterValidation.mockReturnValue({ error: null });

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .put("/users/nonexistentId")
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("user not found");
    });

    it("should hash password before updating", async () => {
      UserRegisterValidation.mockReturnValue({ error: null });

      User.findById.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.findByIdAndUpdate.mockResolvedValue({
        _id: "user1",
        ...updateData,
        password: "hashedPassword",
      });

      await request(app).put("/users/user1").send(updateData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(updateData.password, "salt");
    });
  });

  describe("DELETE /users/:id", () => {
    const mockUser = {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
    };

    it("should delete user successfully", async () => {
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const response = await request(app).delete("/users/user1");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("deleted successfully");
      expect(User.findByIdAndDelete).toHaveBeenCalledWith("user1");
    });

    it("should return 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).delete("/users/nonexistentId");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("user not found");
    });

    it("should check if user exists before deletion", async () => {
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      await request(app).delete("/users/user1");

      expect(User.findById).toHaveBeenCalledWith("user1");
      expect(User.findByIdAndDelete).toHaveBeenCalledWith("user1");
    });
  });
});
