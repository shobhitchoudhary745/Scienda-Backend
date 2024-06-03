const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },
    answers: [
      {
        flag: {
          type: Boolean,
        },
        comment: {
          type: String,
        },
        status: {
          type: String,
          enum: ["Right", "Wrong"],
        },
      },
    ],
    attempt: {
      type: Number,
      default: 0,
    },
    unattempt: {
      type: Number,
      default: 0,
    },
    correct_answers: {
      type: Number,
      default: 0,
    },
    wrong_answers: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Report", Schema);
