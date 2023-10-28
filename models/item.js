const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: String,
    company: String,
    purchasePrice: String,
    salesPrice: String,
    profit: String,
    amount: String,
    unit: String,
    liquidity: String,
    sellerName: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
