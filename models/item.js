const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: String,
    weight: String,
    basePrice: String,
    price: String,
    profit: String,
    amount: String,
    billId: String,
    fileName: String,
    date: String,
    logicalDelete: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
