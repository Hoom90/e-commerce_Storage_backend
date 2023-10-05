const mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    username: String, // نام کاربری
    password: String, // رمز عبور
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
