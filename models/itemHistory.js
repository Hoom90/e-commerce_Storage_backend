const mongoose = require("mongoose");

const itemHistorySchema = new mongoose.Schema(
  {
    item: String,
    company: String,
    previousAmount: String,
    newAmount: String,
    action: String,
    profit: String,
    description: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemHistory", itemHistorySchema);
