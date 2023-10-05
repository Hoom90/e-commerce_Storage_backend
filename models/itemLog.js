const mongoose = require("mongoose");
const schema = mongoose.Schema;

const itemLogSchema = new schema(
  {
    name: String,
    oldVal: String,
    newVal: String,
    field: String,
    description: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemLog", itemLogSchema);
