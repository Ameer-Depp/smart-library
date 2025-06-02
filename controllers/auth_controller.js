const asyncHandler = require("express-async-handler");
const {
  User,
  UserRegisterValidation,
  UserLoginValidation,
} = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// register user
const registerUser = asyncHandler(async (req, res) => {
  const { error } = await UserRegisterValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(400).json({ message: "this user is already used" });
  }

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.status(200).json(newUser);
});

const loginUser = asyncHandler(async (req, res) => {
  // 1. Validate input
  const { error } = UserLoginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // 2. Check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // 3. Verify password
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // 4. Generate JWT
  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // 5. Send response (using user.toJSON() to exclude sensitive fields)
  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// exporting the functions
module.exports = {
  registerUser,
  loginUser,
};
