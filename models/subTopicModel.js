const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    sub_topic_name: {
      type: String,
    },
    topic_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("SubTopic", Schema);
