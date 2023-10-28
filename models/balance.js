const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema(
  {
    action: String,
    current: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Balance", balanceSchema);
