const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    validity: {
      type: String,
      enum: ["Monthly", "Quarterly", "Annually"],
    },
    price: {
      type: Number,
    },
    features: [{ type: String }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("Plan", Schema);
