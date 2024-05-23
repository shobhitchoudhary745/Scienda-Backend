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
      enum: ["Pending", "Accepted", "Closed"],
      default: "Pending"
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
