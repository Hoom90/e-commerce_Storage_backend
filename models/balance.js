const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema(
  {
    income: String,
    outcome: String,
    balance: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Balance", balanceSchema);
