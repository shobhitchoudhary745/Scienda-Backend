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
    description: {
      type: String,
    },
    references: [{ type: String }],
    images: [{ type: String }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("SubTopic", Schema);
