const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    subdomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("ModifiedQuestion", Schema);
