const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    sub_topic_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTopic",
    },
    difficulty_level: {
      type: String,
      enum: ["Basic", "Medium", "Advanced"],
    },
    explanation: {
      description: {
        type: String,
        default: "<p></p>",
      },
      images: [{ type: String }],
      references: [{ type: String }],
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["Pending", "Completed"],
    },
    options: [{ type: String }],
    correct_option: {
      type: String,
    },
    question_type: {
      type: String,
      enum: ["True/False", "Select Best Option"],
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Question", Schema);
