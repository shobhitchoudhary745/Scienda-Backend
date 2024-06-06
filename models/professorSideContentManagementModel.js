const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
    },
    subdomain_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDomain",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProfessorContentManagement", schema);
