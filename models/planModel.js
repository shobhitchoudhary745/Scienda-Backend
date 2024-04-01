const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    validity: {
      type: Number,
    },
    price: {
      type: Number
    }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Plan", Schema);
