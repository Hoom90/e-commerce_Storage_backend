const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();

router.post("/login", async (req, res, next) => {
  try {
    const db = await User.find();
    if (db.length == 0) {
      let password = "Vemh0zSYBf";
      let username = "admin";
      bcrypt.hash(password, 10, function (err, hashedPass) {
        if (err) {
          res.json({
            error: err,
          });
        }

        let user = new User({
          username,
          password: hashedPass,
        });

        user.save().then((user) => {
          req.body = { username, password };
        });
      });
    }
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "No User Found!" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Password does not match!" });
    }

    const accessToken = jwt.sign(
      { username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login Successful!",
      token: accessToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
