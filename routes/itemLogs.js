const express = require("express");
const router = express.Router();
const Log = require("../models/itemLog");
require("dotenv").config();

// Getting all
router.get("/", async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
router.get("/:date", async (req, res) => {
  try {
    let logs = await Log.find({ date: req.params.date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
