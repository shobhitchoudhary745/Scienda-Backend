const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Open", "Closed"],
      default: "Pending",
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    reference: {
      type: String,
    },
    subdomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
    chats: [
      {
        message: {
          type: String,
        },
        from: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
  },

  { timestamps: true }
);

module.exports = mongoose.model("Ticket", Schema);
