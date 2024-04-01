const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = new mongoose.Schema(
  {
    professor_name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
    },
    dob: {
      type: Date,
    },
    joining_date: {
      type: Date,
      default: new Date(),
    },
    mobile: {
      type: String,
    },
    address: {
      type: String,
    },
    professor_id: {
      type: String,
    },
    domain: {
      type: String,
    },
    speciality: [{
      type: String,
    }],
    profile_url:{
      type:String
    }
  },

  { timestamps: true }
);

Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("SubAdmin", Schema);
