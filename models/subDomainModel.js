const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    sub_domain_name: {
      type: String,
    },
    domain_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
    },
    domain_url: {
      type: String,
    },
    description:{
      type: String
    },
    plans:[{type:mongoose.Schema.Types.ObjectId,ref:"Plan"}]
  },

  { timestamps: true }
);

module.exports = mongoose.model("SubDomain", Schema);
