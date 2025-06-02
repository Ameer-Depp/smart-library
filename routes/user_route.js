const express = require("express");
const {
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
} = require("../controllers/user_controller");
const {
  verifyToken,
  isAdmin,
  verifyTokenAndAuthorization,
} = require("../middlewares/verification");
const router = express.Router();

// HTTP methods
router.get("/", verifyToken, isAdmin, getAllUsers);
router.get("/:id", verifyToken, verifyTokenAndAuthorization, getOneUser);
router.put("/:id", verifyToken, verifyTokenAndAuthorization, updateUser);
router.delete("/:id", verifyToken, verifyTokenAndAuthorization, deleteUser);

module.exports = router;
