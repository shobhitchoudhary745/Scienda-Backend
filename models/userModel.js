const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
      default:
        "https://tse4.mm.bing.net/th?id=OIP.eXWcaYbEtO2uuexHM8sAwwHaHa&pid=Api&P=0&h=180",
    },
    profile_url: {
      type: String,
    },
    dob: {
      type: String,
    },
    mobile: {
      type: String,
    },
    otp: {
      type: Number,
    },
    is_verified: {
      type: Boolean,
    },
  },

  { timestamps: true }
);


Schema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 11);
});

Schema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

Schema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET);
};

module.exports = mongoose.model("User", Schema);
