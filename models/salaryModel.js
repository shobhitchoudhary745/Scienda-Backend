const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubAdmin",
    },
    amount: {
      type: Number,
    },
    area_wise: [
      {
        subdomain: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubDomain",
        },
        amount: {
          type: Number,
        },
        number_of_transaction: {
          type: Number,
        },
      },
    ],
    transfer_id: {
      type: String,
    },
    receipt: {
      type: String,
      default: "",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Salary", Schema);
