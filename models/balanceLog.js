const mongoose = require("mongoose");

const balanceLogSchema = new mongoose.Schema(
  {
    cost: String,
    personName: String,
    description: String,
    cash: String,
    card: String,
    date: String,
    logicalDelete: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("BalanceLog", balanceLogSchema);
