const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();
const History = require("../models/balanceHistory");
const Balance = require("../models/balance");
const Item = require("../models/item");
const ItemLogs = require("../models/itemLog");
require("dotenv").config();

const authenticate = require("../middleware/authenticate");
const client = new MongoClient(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
});

// Getting all
router.get("/", async (req, res) => {
  try {
    const items = await Item.find({ logicalDelete: false });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting One
router.get("/:id", async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (item == null) {
      res.status(404).json({ message: "Item Not Found" });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Creating one
router.post("/", authenticate, async (req, res) => {
  let session;
  try {
    session = client.startSession();
    session.startTransaction();
    if (
      req.body.name == null ||
      req.body.outcome == null ||
      req.body.balance == null ||
      req.body.basePrice == null ||
      req.body.card == null ||
      req.body.amount == null
    ) {
      res.status(204);
      session.abortTransaction();
      return;
    } else {
      const balance = new Balance({
        income: "0",
        outcome: req.body.outcome,
        balance: req.body.balance,
        date: req.body.date,
      });
      let history = new History({
        cash: "0",
        card: req.body.card,
        date: req.body.date,
        description: req.body.description,
        logicalDelete: false,
      });
      const item = new Item({
        name: req.body.name,
        weight: req.body.weight,
        basePrice: req.body.basePrice,
        price: req.body.price,
        profit: req.body.profit,
        amount: req.body.amount,
        billId: req.body.billId,
        date: req.body.date,
        logicalDelete: false,
      });
      await history.save(); // save history
      await balance.save(); // save balance
      await item.save();
      const newLog = new ItemLogs({
        description: "خرید کالای جدید <" + req.body.name + ">.",
        date: req.body.date,
      });
      res.status(201).json(await newLog.save());
      await session.commitTransaction();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Creating list
router.post("/list", authenticate, async (req, res) => {
  let session;
  try {
    let data = req.body;
    let account = data[0];
    session = client.startSession();
    session.startTransaction();
    if (
      account.outcome == null ||
      account.balance == null ||
      account.card == null
    ) {
      res.status(204);
      session.abortTransaction();
      return;
    }
    const balance = new Balance({
      income: "0", // ورودی از طریق خرید کالا وجود ندارد
      outcome: account.outcome, // بدهی از طریق خرید کالا اینجا ثبت میشود
      balance: account.balance, // بدهی از روی حساب کسر میشود
      date: account.date,
    });
    let history = new History({
      cash: "0", // هیچ مقداری نقدا پرداخت نشده است
      card: account.card, // مقدار پرداختی از طریق کالا به شکل کارتی پرداخت شده است
      date: account.date,
      description: account.description,
      logicalDelete: false,
    });
    await history.save(); // save history
    await balance.save(); // save balance
    for (let i = 1; i < data.length; i++) {
      if (
        data[i].name == null ||
        data[i].basePrice == null ||
        data[i].amount == null
      ) {
        res.status(204);
        session.abortTransaction();
        return;
      } else {
        const item = new Item({
          name: data[i].name,
          weight: data[i].weight,
          basePrice: data[i].basePrice,
          price: data[i].price,
          profit: data[i].profit,
          amount: data[i].amount,
          billId: data[i].billId,
          date: data[i].date,
          logicalDelete: false,
        });
        const newLog = new ItemLogs({
          description: "خرید کالای جدید <" + data[i].name + ">.",
          date: data[i].date,
        });
        await item.save();
        await newLog.save();
      }
      res.status(201).json();
      await session.commitTransaction();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Updating One
router.patch("/:id", authenticate, getItem, async (req, res) => {
  let session;
  try {
    session = client.startSession();
    session.startTransaction();
    if (req.body.update) {
      let name = res.item.name;
      let oldVal = [];
      let newVal = [];
      let field = [];
      if (req.body.name) {
        if (req.body.name != res.item.name) {
          oldVal.push(res.item.name);
          newVal.push(req.body.name);
          field.push("نام کالا");

          res.item.name = req.body.name;
        }
      }
      if (req.body.weight) {
        if (req.body.weight != res.item.weight) {
          oldVal.push(res.item.weight);
          newVal.push(req.body.weight);
          field.push("وزن کالا");

          res.item.weight = req.body.weight;
        }
      }
      if (req.body.basePrice) {
        if (req.body.basePrice != res.item.basePrice) {
          oldVal.push(res.item.basePrice);
          newVal.push(req.body.basePrice);
          field.push("قیمت خرید کالا");

          res.item.basePrice = req.body.basePrice;
        }
      }
      if (req.body.price) {
        if (req.body.price != res.item.price) {
          oldVal.push(res.item.price);
          newVal.push(req.body.price);
          field.push("قیمت فروش کالا");

          res.item.price = req.body.price;
        }
      }
      if (req.body.profit) {
        if (req.body.profit != res.item.profit) {
          oldVal.push(res.item.profit);
          newVal.push(req.body.profit);
          field.push("سود کالا");

          res.item.profit = req.body.profit;
        }
      }
      if (req.body.amount) {
        if (req.body.amount != res.item.amount) {
          oldVal.push(res.item.amount);
          newVal.push(req.body.amount);
          field.push("موجودی کالا");

          res.item.amount = req.body.amount;
        }
      }
      if (req.body.billId) {
        if (req.body.billId != res.item.billId) {
          oldVal.push(res.item.billId);
          newVal.push(req.body.billId);
          field.push("مشخصات فاکتور کالا");

          res.item.billId = req.body.billId;
        }
      }
      if (req.body.date) {
        if (req.body.date != res.item.date) {
          oldVal.push(res.item.date);
          newVal.push(req.body.date);
          field.push("تاریخ دریافت کالا");

          res.item.date = req.body.date;
        }
      }

      let description = "ویرایش <" + name + ">. ";
      for (let i = 0; i < oldVal.length; i++) {
        description =
          description +
          "<" +
          field[i] +
          "> از " +
          oldVal[i] +
          "به " +
          newVal[i] +
          ". ";
      }
      await res.item.save();
      const newLog = new ItemLogs({
        description,
        date: req.body.update,
      });
      res.status(200).json(await newLog.save());
      await session.commitTransaction();
    } else {
      res.status(204);
      session.abortTransaction();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Updating One Amount
router.put("/:id", authenticate, getItem, async (req, res) => {
  let session;
  session = client.startSession();
  try {
    session.startTransaction();
    if (
      req.body.income &&
      req.body.outcome &&
      req.body.balance &&
      req.body.amount &&
      req.body.date
    ) {
      let oldVal = res.item.amount;
      let name = res.item.name;
      res.item.amount = req.body.amount;
      const newLog = new ItemLogs({
        name,
        oldVal,
        newVal: req.body.amount,
        field: "فروش کالا",
        date: req.body.date,
      });
      const balance = new Balance({
        income: req.body.income,
        outcome: req.body.outcome,
        balance: req.body.balance,
        date: req.body.date,
      });
      let history = new History({
        cash: "0",
        card: parseInt(req.body.income) + parseInt(req.body.outcome),
        date: req.body.date,
        description: req.body.description,
        logicalDelete: false,
      });
      await history.save(); // save history
      await balance.save(); // save balance
      await newLog.save(); //save log
      await res.item.save(); // edit item
      res.status(200);
      await session.commitTransaction();
    } else {
      res.status(204);
      session.abortTransaction();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Deleting One
router.delete("/:id", authenticate, getItem, async (req, res) => {
  let session;
  try {
    session = client.startSession();
    session.startTransaction();
    if (
      req.body.logicalDelete != null &&
      req.body.date != null &&
      req.body.income != null &&
      req.body.outcome != null &&
      req.body.balance != null
    ) {
      res.item.logicalDelete = req.body.logicalDelete;
      const balance = new Balance({
        income: req.body.income,
        outcome: req.body.outcome,
        balance: req.body.balance,
        date: req.body.date,
      });
      let history = new History({
        cash: "0",
        card: -req.body.outcome,
        date: req.body.date,
        description: req.body.description,
        logicalDelete: false,
      });
      const newLog = new ItemLogs({
        description: "حذف کالای<" + res.item.name + "> از سیستم.",
        date: req.body.date,
      });
      await history.save(); // save history
      await balance.save(); // save balance
      await res.item.save();
      await newLog.save();
      res.status(200).json({ message: "Deleted Item" });
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

async function getItem(req, res, next) {
  let item;
  try {
    item = await Item.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: "Cannot find Item" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

module.exports = router;
