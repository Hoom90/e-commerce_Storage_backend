const express = require("express");
const router = express.Router();
const Log = require("../models/itemHistory");
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
    let date = req.params.date;
    let logs = await Log.find({ date: date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
