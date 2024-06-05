const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    test_name: {
      type: String,
    },
    number_of_questions: {
      type: Number,
    },
    questions_reference: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    duration_in_mins: {
      type: Number,
    },
    start_date: {
      type: Date,
    },
    test_creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubAdmin",
    },
    test_type: {
      type: String,
      enum: ["Quiz", "Exam"],
    },
    subdomain_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
    status: {
      type: String,
      enum: ["Active", "Pending"],
      default: "Pending",
    },
    subtopic_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTopic",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Test", Schema);
