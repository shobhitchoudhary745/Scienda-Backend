const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubAdmin",
    },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("SubadminNotification", Schema);
