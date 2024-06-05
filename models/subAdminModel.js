const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: Number,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    profile_url: {
      type: String,
      default: "/test/1717483821163-user.jfif",
    },
    address: {
      type: String,
    },
    dob: {
      type: String,
    },
    joining_date: {
      type: String,
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
    },
    sub_domain: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubDomain" }],
    mobile: {
      type: String,
    },
    professor_id: {
      type: String,
    },
    pay_percent: {
      type: Number,
    },
    account_id: {
      type: String,
    },
  },

  { timestamps: true }
);

Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

Schema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

Schema.methods.getToken = async function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET);
};

module.exports = mongoose.model("SubAdmin", Schema);
