const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    domain_name: {
      type: String,
    },
    description: {
      type: String,
    }, 
    
  },

  { timestamps: true }
);

module.exports = mongoose.model("Domain", Schema);
