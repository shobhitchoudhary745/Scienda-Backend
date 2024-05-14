const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    validity: {
      type: String,
      enum: ["Monthly", "Quaterly", "Annually"],
    },
    price: {
      type: Number,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Plan", Schema);
