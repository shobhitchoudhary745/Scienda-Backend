const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    validity: {
      type: Number,
    },
    monthly_price: {
      type: Number,
    },
    quaterly_price: {
      type: Number,
    },
    yearly_price: {
      type: Number,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Plan", Schema);
