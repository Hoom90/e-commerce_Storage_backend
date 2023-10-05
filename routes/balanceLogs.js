const express = require("express");
const router = express.Router();
const Log = require("../models/balanceLog");
require("dotenv").config();
const dayjs = require("dayjs");

const authenticate = require("../middleware/authenticate");

// Getting all
router.get("/", async (req, res) => {
  try {
    const logs = await Log.find({ logicalDelete: false });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
router.get("/:date", async (req, res) => {
  try {
    let date = req.params.date;
    date = date.replace("-", "/");
    date = date.replace("-", "/");
    let logs = await Log.find({ date: date, logicalDelete: false });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
// router.get("/:date", async (req, res) => {
//   try {
//     let log = await Log.findById(req.params.date);
//     if (log == null) {
//       res.status(200).json({ message: "Log Not Found" });
//       return;
//     }
//     res.json(log);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

//Update One
router.patch("/:id", authenticate, getDocument, async (req, res) => {
  try {
    if (req.body.personName != "" && res.document.personName) {
      res.document.personName = req.body.personName;
    }
    if (req.body.cost != "" && res.document.cost) {
      res.document.cost = req.body.cost;
    }
    if (req.body.description != "" && res.document.description) {
      res.document.description = req.body.description;
    }
    if (req.body.cash != "" && res.document.cash) {
      res.document.cash = req.body.cash;
    }
    if (req.body.card != "" && res.document.card) {
      res.document.card = req.body.card;
    }
    res.status(200).json(await res.document.save());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function getDocument(req, res, next) {
  let document;
  try {
    document = await Log.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: "Cannot find Document" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.document = document;
  next();
}

module.exports = router;
