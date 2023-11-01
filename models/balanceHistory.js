const mongoose = require("mongoose");

const balanceHistorySchema = new mongoose.Schema(
  {
    receiverName: String,
    amount: String,
    debt: String,
    type: String,
    description: String,
    date: String,
    fk: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("BalanceHistory", balanceHistorySchema);
