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
      enum: ["Active", "Pending", "Expire"],
    },
    invoice_url: {
      type: String,
    },
    validity: {
      type: Number,
    },
    expiry: {
      type: Date,
    },
    subdomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
    plan_type: {
      type: String,
      enum: ["Monthly", "Quarterly", "Annually"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", schema);
