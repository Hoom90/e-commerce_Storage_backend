const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();
const Balance = require("../models/balance");
const BalanceHistory = require("../models/balanceHistory");
require("dotenv").config();

const authenticate = require("../middleware/authenticate");
const client = new MongoClient(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
});

// Getting all
router.get("/", async (req, res) => {
  try {
    const balances = await Balance.find();
    res.status(200).json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting all by date
router.get("/:date", async (req, res) => {
  try {
    let date = req.params.date;
    let balances = await Balance.find({ date: date });
    res.json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Creating one
router.post("/expense", authenticate, getLastBalanceData, async (req, res) => {
  let session;
  try {
    let receiverName = req.body.receiverName;
    let paid = req.body.paid;
    let description = req.body.description;
    let type = req.body.type;
    let date = req.body.date;

    if (
      receiverName == null ||
      paid == null ||
      type == null ||
      date == null ||
      description == null
    ) {
      res.status(400);
      return;
    }

    let current = parseInt(res.balance.current) - parseInt(paid);
    let fk = Math.floor(Math.random() * 1000000000) + 1;
    session = client.startSession();
    session.startTransaction();

    // fill LOST balance prop
    const balance = new Balance({
      action: -paid,
      current,
      date,
      fk,
    });

    // fill balance log prop
    const balanceHistory = new BalanceHistory({
      receiverName,
      amount: -paid,
      debt: "0",
      type,
      description,
      date,
      fk,
    });

    await balance.save();
    await balanceHistory.save();

    res.status(200);
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Creating one
router.post("/earning", authenticate, getLastBalanceData, async (req, res) => {
  let session;
  try {
    let receiverName = req.body.receiverName;
    let paid = req.body.paid;
    let description = req.body.description;
    let type = req.body.type;
    let date = req.body.date;

    if (
      receiverName == null ||
      paid == null ||
      type == null ||
      date == null ||
      description == null
    ) {
      res.status(400);
      return;
    }
    let current = parseInt(res.balance.current) + parseInt(paid);

    session = client.startSession();
    session.startTransaction();

    // fill EARN balance prop
    const balance = new Balance({
      action: paid,
      current,
      date,
    });

    // fill balance log prop
    const balanceHistory = new BalanceHistory({
      receiverName,
      amount: paid,
      debt: "0",
      type,
      description,
      date,
    });

    await balance.save();
    await balanceHistory.save();

    res.status(200);
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Updating One
// router.patch("/:id", authenticate, getDocument, async (req, res) => {
//   let session;
//   try {
//     let income = req.body.income;
//     let outcome = req.body.outcome;
//     let balance = req.body.balance;
//     let cash = req.body.cash;
//     let card = req.body.card;
//     let personName = req.body.personName;
//     let description = req.body.description;

//     if (
//       income == null ||
//       outcome == null ||
//       balance == null ||
//       card == null ||
//       cash == null ||
//       personName == null ||
//       description == null
//     ) {
//       res.status(400);
//       return;
//     }

//     session = client.startSession();
//     session.startTransaction();

//     res.document.income = req.body.income;
//     res.document.balance = req.body.balance;
//     res.document.outcome = req.body.outcome;

//     const balanceHistory = new BalanceHistory({
//       receiverName: personName,
//       card: cash,
//       cash: card,
//       description: description,
//       date: req.body.date,
//     });

//     await res.document.save();
//     await balanceHistory.save();

//     res.status(201);
//     await session.commitTransaction();
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//     session.abortTransaction();
//   } finally {
//     session.endSession();
//   }
// });

// Deleting One Log
router.delete(
  "/:id",
  authenticate,
  getBalanceHistory,
  getLastBalanceData,
  getBalance,
  async (req, res) => {
    let session;
    try {
      session = client.startSession();
      session.startTransaction();

      try {
        await res.balance.deleteOne();
        await res.history.deleteOne();
      } catch (err) {
        session.abortTransaction();
        res.status(500).json({ message: err.message });
        return;
      }
      res.status(201);
      await session.commitTransaction();
    } catch (err) {
      res.status(400).json({ message: err.message });
      session.abortTransaction();
    }
  }
);

async function getBalanceHistory(req, res, next) {
  let history;
  try {
    let id = req.body.id;
    if (id == null) {
      return res.status(204);
    }
    history = await BalanceHistory.findById(id);
    if (history == null) {
      return res.status(404).json({ message: "Cannot find Log" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.history = history;
  next();
}

async function getLastBalanceData(req, res, next) {
  let balance;
  try {
    balance = await Balance.find();
    if (balance == null) {
      return (res.balance = {
        action: "0",
        current: "0",
        date: "1402/7/1",
      });
    }
    balance = balance[balance.length - 1];
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.balance = balance;
  next();
}

async function getBalance(req, res, next) {
  let balance;
  try {
    let fk = req.body.fk;
    if (fk == null) {
      return res.status(204);
    }
    balance = await Balance.findOne({ fk: fk });
    if (balance == null) {
      return res.status(404).json({ message: "Cannot find Balance" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  console.log(balance);
  res.balance = balance;
  next();
}
module.exports = router;
