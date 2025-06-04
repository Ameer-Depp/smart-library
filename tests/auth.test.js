const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { registerUser, loginUser } = require("../controllers/auth_controller");
const {
  User,
  UserRegisterValidation,
  UserLoginValidation,
} = require("../models/User");

// Mock dependencies
jest.mock("../models/User");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const app = express();
app.use(express.json());
app.post("/register", registerUser);
app.post("/login", loginUser);

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    const validUserData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    it("should register a new user successfully", async () => {
      UserRegisterValidation.mockResolvedValue({ error: null });
      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.create.mockResolvedValue({
        _id: "userId",
        ...validUserData,
        password: "hashedPassword",
      });

      const response = await request(app).post("/register").send(validUserData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(validUserData.name);
      expect(response.body.email).toBe(validUserData.email);
    });

    it("should return 400 for invalid user data", async () => {
      UserRegisterValidation.mockResolvedValue({
        error: { details: [{ message: "Name is required" }] },
      });

      const response = await request(app)
        .post("/register")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Name is required");
    });

    it("should return 400 if user already exists", async () => {
      UserRegisterValidation.mockResolvedValue({ error: null });
      User.findOne.mockResolvedValue({ email: validUserData.email });

      const response = await request(app).post("/register").send(validUserData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("this user is already used");
    });

    it("should hash password before saving", async () => {
      UserRegisterValidation.mockResolvedValue({ error: null });
      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue("salt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.create.mockResolvedValue({
        _id: "userId",
        ...validUserData,
        password: "hashedPassword",
      });

      await request(app).post("/register").send(validUserData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, "salt");
      expect(User.create).toHaveBeenCalledWith({
        name: validUserData.name,
        email: validUserData.email,
        password: "hashedPassword",
      });
    });
  });

  describe("POST /login", () => {
    const loginData = {
      email: "john@example.com",
      password: "password123",
    };

    const mockUser = {
      _id: "userId",
      name: "John Doe",
      email: "john@example.com",
      password: "hashedPassword",
      role: "user",
      isAdmin: false,
    };

    it("should login user successfully", async () => {
      UserLoginValidation.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      const response = await request(app).post("/login").send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token", "mockToken");
      expect(response.body.user).toEqual({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it("should return 400 for invalid input", async () => {
      UserLoginValidation.mockReturnValue({
        error: { details: [{ message: "Email is required" }] },
      });

      const response = await request(app)
        .post("/login")
        .send({ password: "test" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is required");
    });

    it("should return 401 if user does not exist", async () => {
      UserLoginValidation.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/login").send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 401 for invalid password", async () => {
      UserLoginValidation.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app).post("/login").send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should generate JWT token with correct payload", async () => {
      UserLoginValidation.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      await request(app).post("/login").send(loginData);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, isAdmin: mockUser.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
    });
  });
});
