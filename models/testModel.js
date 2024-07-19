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
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    subtopic_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTopic",
    },
    timed_out: {
      type: Boolean,
      default: false,
    },
    topic_reference: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    timed_out_user: [{ type: String }],
    testNeedsToBeModified: {
      type: Boolean,
      default: false,
    },
    testModified: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Test", Schema);
