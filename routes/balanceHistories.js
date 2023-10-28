const express = require("express");
const router = express.Router();
const BalanceHistory = require("../models/balanceHistory");
require("dotenv").config();

const authenticate = require("../middleware/authenticate");

// Getting all
router.get("/", async (req, res) => {
  try {
    const logs = await BalanceHistory.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
router.get("/:date", async (req, res) => {
  try {
    let date = req.params.date;
    date = date.replace("-", "/").replace("-", "/");
    let logs = await BalanceHistory.find({ date: date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Update One
router.patch("/:id", authenticate, getDocument, async (req, res) => {
  try {
    let receiverName = req.body.receiverName;
    let description = req.body.description;

    if (receiverName) {
      if (receiverName != "" && res.document.personName) {
        res.document.personName = receiverName;
      }
    }

    if (description) {
      if (description != "" && res.document.description) {
        res.document.description = description;
      }
    }

    await res.document.save();

    res.status(201);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function getDocument(req, res, next) {
  let history;
  try {
    history = await BalanceHistory.findById(req.params.id);
    if (history == null) {
      return res.status(404);
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.history = history;
  next();
}

module.exports = router;
