const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: String, // نام کاربری
    password: String, // رمز عبور
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
