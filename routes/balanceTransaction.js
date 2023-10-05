const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();
const Document = require("../models/balance");
const Log = require("../models/balanceLog");
require("dotenv").config();

const authenticate = require("../middleware/authenticate");
const client = new MongoClient(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
});

// Getting all
router.get("/", async (req, res) => {
  try {
    const documents = await Document.find();
    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting all by date
router.get("/:date", async (req, res) => {
  try {
    let date = req.params.date;
    date = date.replace("-", "/");
    date = date.replace("-", "/");
    let documents = await Document.find({ date: date, logicalDelete: false });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Creating one
router.post("/", authenticate, async (req, res) => {
  let session;
  try {
    let income = req.body.income;
    let outcome = req.body.outcome;
    let balance = req.body.balance;

    if (income == null || outcome == null || balance == null) {
      res.status(400);
      return;
    }

    session = client.startSession();
    session.startTransaction();

    let log = null;

    const document = new Document({
      income: income,
      outcome: outcome,
      balance: balance,
      date: req.body.date,
    });

    let cost = req.body.cost;
    let personName = req.body.personName;
    let description = req.body.description;

    if (cost == null || personName == null || description == null) {
      let cash = req.body.cash;
      let card = req.body.card;

      if (cash == null || card == null) {
        res.status(400);
        session.abortTransaction();
        return;
      }

      log = new Log({
        cash: cash,
        card: card,
        date: req.body.date,
        logicalDelete: false,
      });
    } else {
      log = new Log({
        cost: cost,
        personName: personName,
        description: description,
        date: req.body.date,
        logicalDelete: false,
      });
    }

    await document.save();
    const savedLog = await log.save();

    res.status(201).json(savedLog);
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Updating One
router.patch("/:id", authenticate, getDocument, async (req, res) => {
  let session;
  try {
    session = client.startSession();
    session.startTransaction();
    if (req.body.income != "") {
      res.document.income = req.body.income;
      res.document.balance = req.body.balance;
    }
    if (req.body.outcome != "") {
      res.document.outcome = req.body.outcome;
      res.document.balance = req.body.balance;
    }
    const log = new Log({
      cost: req.body.cost,
      personName: req.body.personName,
      description: req.body.description,
      cash: req.body.cash,
      card: req.body.card,
      date: req.body.date,
    });
    await res.document.save();
    res.status(200).json(await log.save());
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Deleting One Log
router.delete("/:id", authenticate, getLog, async (req, res) => {
  let session;
  try {
    let income = req.body.income;
    let outcome = req.body.outcome;
    let balance = req.body.balance;

    if (income == null || outcome == null || balance == null) {
      res.status(400);
      return;
    }

    session = client.startSession();
    session.startTransaction();

    let logicalDelete = req.body.logicalDelete;
    let date = req.body.date;

    if (logicalDelete && date && income && outcome && balance) {
      res.log.logicalDelete = logicalDelete;

      const document = new Document({
        income: income,
        outcome: outcome,
        balance: balance,
        date: date,
      });

      await document.save();
      await res.log.save();
      res.status(200).json({ message: "Deleted Document" });
      await session.commitTransaction();
    } else {
      res.status(400).json({ message: "Input Check" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

async function getDocument(req, res, next) {
  let document;
  try {
    document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: "Cannot find Document" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.document = document;
  next();
}

async function getLog(req, res, next) {
  let log;
  try {
    log = await Log.findById(req.params.id);
    if (log == null) {
      return res.status(404).json({ message: "Cannot find Log" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.log = log;
  next();
}

module.exports = router;
