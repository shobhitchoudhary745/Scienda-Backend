const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    plan_id: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    payment_id: {
      type: String,
      required: true,
    },
    gateway: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
    },
    invoice_url: {
      type: String,
    },
    validity: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", schema);
