const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();
const Item = require("../models/item");
const ItemHistory = require("../models/itemHistory");
const BalanceHistory = require("../models/balanceHistory");
const Balance = require("../models/balance");
require("dotenv").config();

const authenticate = require("../middleware/authenticate");
const client = new MongoClient(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
});

// Getting all
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
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
router.post("/", authenticate, getLastBalanceData, async (req, res) => {
  let session;
  // item feature
  let name = req.body.name;
  let sellerName = req.body.sellerName;
  let company = req.body.company;
  let purchasePrice = req.body.purchasePrice;
  let salesPrice = req.body.salesPrice;
  let amount = req.body.amount;
  let unit = req.body.unit;
  let date = req.body.date;
  // item dependency
  let paid = req.body.paid;
  let type = req.body.type;
  let description = req.body.description;
  if (
    name == null ||
    company == null ||
    purchasePrice == null ||
    salesPrice == null ||
    amount == null ||
    unit == null ||
    sellerName == null ||
    date == null ||
    paid == null ||
    type == null ||
    description == null
  ) {
    res.status(204);
    return;
  }
  let profit = salesPrice - purchasePrice;
  let liquidity = purchasePrice * amount;
  let cost = purchasePrice * amount;
  let debt = cost - paid;
  let current = res.balance.current - paid;
  let logDescription = "خرید کالای جدید <" + name + ">.";
  try {
    session = client.startSession();
    session.startTransaction();
    // fill Item props
    const item = new Item({
      name,
      company,
      purchasePrice,
      salesPrice,
      profit,
      amount,
      unit,
      liquidity,
      sellerName,
      date,
    });
    // fill Item History props
    const itemHistory = new ItemHistory({
      item: name,
      company,
      previousAmount: "0",
      newAmount: amount,
      action: "خرید",
      profit,
      logDescription,
      date,
    });
    // // fill Item Balance Effect History props
    const balanceHistory = new BalanceHistory({
      receiverName: sellerName,
      amount: -paid,
      debt,
      type,
      description,
      date,
    });
    // fill Item Balane Effect props
    const balance = new Balance({
      action: -paid,
      current,
      date,
    });
    await item.save();
    await itemHistory.save();
    await balanceHistory.save();
    await balance.save();
    res.status(200);
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Creating list
router.post("/list", authenticate, getLastBalanceData, async (req, res) => {
  let session;
  try {
    let data = req.body;
    let cost = req.body[0].cost;
    let paid = req.body[0].paid;
    let type = req.body[0].type;
    let date = req.body[0].date;
    let description = req.body[0].description;

    if (
      cost == null ||
      paid == null ||
      type == null ||
      description == null ||
      date == null
    ) {
      res.status(204);
      return;
    }

    session = client.startSession();
    session.startTransaction();

    let debt = cost - paid;
    let current = res.balance.current - paid;
    let sellerName = data[1].sellerName;

    // // fill Item Balance Effect History props
    const balanceHistory = new BalanceHistory({
      receiverName: sellerName,
      amount: -paid,
      debt,
      type,
      description,
      date,
    });

    // fill Item Balane Effect props
    const balance = new Balance({
      action: -paid,
      current,
      date,
    });

    for (let i = 1; i < data.length; i++) {
      // item feature
      let name = data[i].name;
      let company = data[i].company;
      let purchasePrice = data[i].purchasePrice;
      let salesPrice = data[i].salesPrice;
      let amount = data[i].amount;
      let unit = data[i].unit;
      let sellerName = data[i].sellerName;
      let date = data[i].date;

      let profit = purchasePrice - salesPrice;
      let liquidity = purchasePrice * amount;
      let logDescription = "خرید کالای جدید <" + name + ">.";

      if (
        name == null ||
        company == null ||
        purchasePrice == null ||
        salesPrice == null ||
        amount == null ||
        unit == null ||
        sellerName == null ||
        date == null
      ) {
        res.status(204);
        session.abortTransaction();
        return;
      } else {
        // fill Item props
        const item = new Item({
          name,
          company,
          purchasePrice,
          salesPrice,
          profit,
          amount,
          unit,
          liquidity,
          sellerName,
          date,
        });
        // fill Item History props
        const itemHistory = new ItemHistory({
          item: name,
          company,
          previousAmount: "0",
          newAmount: amount,
          action: "خرید",
          profit,
          logDescription,
          date,
        });
        await item.save();
        await itemHistory.save();
      }
    }

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
router.patch("/:id", authenticate, getItem, async (req, res) => {
  let session;
  try {
    // item feature
    let name = req.body.name;
    let salesPrice = req.body.salesPrice;
    let date = req.body.date;
    // item dependency
    let update = req.body.update;

    if (name == null && salesPrice == null && date == null && update == null) {
      res.status(204);
      return;
    }

    session = client.startSession();
    session.startTransaction();

    let oldVal = [];
    let newVal = [];
    let field = [];
    let nameHistory = res.item.name;
    let description = "ویرایش <" + nameHistory + ">. ";

    if (name) {
      if (name != nameHistory) {
        oldVal.push(nameHistory);
        newVal.push(name);
        field.push("نام کالا");

        res.item.name = name;
        nameHistory = name;
      }
    }
    if (salesPrice) {
      if (salesPrice != res.item.salesPrice) {
        oldVal.push(res.item.salesPrice);
        newVal.push(salesPrice);
        field.push("قیمت فروش کالا");

        res.item.salesPrice = salesPrice;
        let profit = res.item.purchasePrice - salesPrice;
        res.item.profit = profit;
      }
    }
    if (date) {
      if (date != res.item.date) {
        oldVal.push(res.item.date);
        newVal.push(date);
        field.push(" تاریخ خرید کالا");

        res.item.date = date;
      }
    }
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

    // fill Item History props
    const itemHistory = new ItemHistory({
      item: nameHistory,
      previousAmount: res.item.amount,
      newAmount: res.item.amount,
      action: "ویرایش",
      profit: res.item.profit,
      description,
      date: update,
    });

    await res.item.save();
    await itemHistory.save();

    res.status(201);
    await session.commitTransaction();
  } catch (err) {
    res.status(400).json({ message: err.message });
    session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// Updating One Amount
router.put(
  "/:id",
  authenticate,
  getItem,
  getLastBalanceData,
  async (req, res) => {
    let session;
    try {
      let sold = req.body.sold;
      let amount = req.body.amount;
      let profit = req.body.profit;
      let date = req.body.date;
      let description = req.body.description;
      if (
        sold == null ||
        amount == null ||
        profit == null ||
        date == null ||
        description == null
      ) {
        res.status(204);
        return;
      }

      session = client.startSession();
      session.startTransaction();

      let current = res.balance.current + sold;

      let previousStockAmount = res.item.amount;
      let soldItemName = res.item.name;
      let soldItemCompanyName = res.item.company;
      let logDescription = "فروش کالای  <" + soldItemName + ">.";
      let sellerName = res.item.sellerName;

      // update Item Amount Value
      res.item.amount = amount;

      // fill Item History props
      const itemHistory = new ItemHistory({
        item: soldItemName,
        company: soldItemCompanyName,
        previousAmount: previousStockAmount,
        newAmount: amount,
        action: "فروش",
        profit,
        logDescription,
        date,
      });

      // fill Item Balane Effect props
      const balance = new Balance({
        action: -sold,
        current,
        date,
      });

      // // fill Item Balance Effect History props
      const balanceHistory = new BalanceHistory({
        receiverName: sellerName,
        amount: -sold,
        debt: "0",
        type: "کارت",
        description,
        date,
      });

      await itemHistory.save();
      await balanceHistory.save();
      await balance.save();
      await res.item.save();

      res.status(200);
      await session.commitTransaction();
    } catch (err) {
      res.status(400).json({ message: err.message });
      session.abortTransaction();
    } finally {
      session.endSession();
    }
  }
);

// Deleting One
router.delete(
  "/:id",
  authenticate,
  getItem,
  getItemBalanceHistory,
  async (req, res) => {
    let session;
    try {
      let date = req.body.date;
      let description = req.body.description;

      if (date == null) {
        res.status(204);
        return;
      }

      session = client.startSession();
      session.startTransaction();

      let name = res.item.name;
      let sellerName = res.history.receiverName;
      let company = res.item.company;
      let amount = res.item.amount;
      let profit = res.item.profit;
      let debt = res.history.debt;
      let logDescription = "حذف کالای  <" + name + ">.";

      if (parseInt(debt) < 0) {
        debt = "0";
      }

      // fill Item Balance Effect History props
      const balanceHistory = new BalanceHistory({
        receiverName: sellerName,
        amount: "0",
        debt: -debt,
        type: "بازگشت",
        description,
        date,
      });

      // fill Item History props
      const itemHistory = new itemHistory({
        item: name,
        company,
        previousAmount: amount,
        newAmount: "0",
        action: "حذف",
        profit: profit,
        logDescription,
        date,
      });

      await balanceHistory.save();
      await itemHistory.save();

      try {
        await res.blog.deleteOne();
      } catch (err) {
        session.abortTransaction();
        res.status(500).json({ message: err.message });
        return;
      }

      res.status(200);
      await session.commitTransaction();
    } catch (err) {
      res.status(400).json({ message: err.message });
      session.abortTransaction();
    } finally {
      session.endSession();
    }
  }
);

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

async function getLastBalanceData(req, res, next) {
  let balance;
  try {
    balance = await Balance.find();
    if (balance.length == 0) {
      res.balance = {
        action: 0,
        current: 0,
        date: "1402-7-1",
      };
    } else {
      balance = balance[balance.length - 1];
      res.balance = balance;
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
}

async function getItemBalanceHistory(req, res, next) {
  let history;
  try {
    let sellerName = req.item.sellerName;
    history = await BalanceHistory.find({ receiverName: sellerName });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.history = history;
  next();
}
module.exports = router;
