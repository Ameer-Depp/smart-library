const Joi = require("joi");
const { default: mongoose } = require("mongoose");

// creating User collection
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// creating the user validation function
function UserRegisterValidation(obj) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(6).max(50).email().required(),
    password: Joi.string().min(6).max(64).required(),
  });
  return schema.validate(obj);
}
function UserLoginValidation(obj) {
  const schema = Joi.object({
    email: Joi.string().min(6).max(50).email().required(),
    password: Joi.string().min(6).max(64).required(),
  });
  return schema.validate(obj);
}

const User = mongoose.model("User", UserSchema);

module.exports = {
  User,
  UserRegisterValidation,
  UserLoginValidation,
};
