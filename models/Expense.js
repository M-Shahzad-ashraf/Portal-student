const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String },
  paymentMethod: { type: String },
  receipt: { type: String },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Expense", expenseSchema);
