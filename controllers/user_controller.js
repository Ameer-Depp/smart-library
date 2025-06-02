const asyncHandler = require("express-async-handler");
const {
  User,
  UserRegisterValidation,
  UserLoginValidation,
} = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

const getOneUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { error } = UserRegisterValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const isUser = await User.findById(req.params.id);
  if (!isUser) {
    return res.status(404).json({ message: "user not found" });
  }
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      },
    },
    { new: true }
  );

  res.status(201).json(updatedUser);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "deleted successfully" });
});

module.exports = { getAllUsers, getOneUser, updateUser, deleteUser };
