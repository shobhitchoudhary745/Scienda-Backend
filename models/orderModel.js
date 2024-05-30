const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    order_id: {
      type: String,
    },
    
    expiry_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Expire", "Pending"],
    },
    start_date: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", schema);
