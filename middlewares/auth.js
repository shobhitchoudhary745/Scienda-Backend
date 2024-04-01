const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const ErrorHandler = require("../utils/errorHandler");
const adminModel = require("../models/adminModel");
dotenv.config({ path: "../config/config.env" });

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: `Authentication Expired` });
    }

    const { userId } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    req.userId = userId;

    // const user = await User.findById(userId);
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, status: 403, message: `Authentication Expired` });
  }
};



exports.isAdmin = async (req, res, next) => {
  try {
    const admin = await adminModel.findById(req.userId).select("+password");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized:Admin Only" });
  }
};
