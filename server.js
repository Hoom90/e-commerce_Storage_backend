const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();

mongoose
  .connect(process.env.DATABASE_URL, {
    authSource: "admin",
  })
  .then(console.log("connected to MongoDB"))
  .catch((err) => {
    console.log("failed to connect MongoDB: " + err.message);
  });

const db = mongoose.connection;

app.use(express.json());
app.use(cors());

const itemTransactionRouter = require("./routes/itemTransaction");
const balanceTranactionRouter = require("./routes/balanceTransaction");
const itemLogsRouter = require("./routes/itemLogs");
const balanceHistoriesRouter = require("./routes/balanceHistories");
const authRouter = require("./routes/auth");

app.use(express.static("public"));
app.use("/api/itemTransaction", itemTransactionRouter);
app.use("/api/balanceTransaction", balanceTranactionRouter);
app.use("/api/itemLogs", itemLogsRouter);
app.use("/api/balanceHistories", balanceHistoriesRouter);
app.use("/api", authRouter);

app.listen(3002, () => console.log("Server Started"));
