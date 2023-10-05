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
router.get("/:id", async (req, res) => {
  try {
    let log = await Log.findById(req.params.id);
    if (log == null) {
      res.status(404).json({ message: "Log Not Found" });
      return;
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
