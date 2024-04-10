const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    topic_name: {
      type: String,
    },
    sub_domain_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Topic", Schema);
