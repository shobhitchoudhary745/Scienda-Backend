const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const ErrorHandler = require("../utils/errorHandler");
const adminModel = require("../models/adminModel");
const subAdminModel = require("../models/subAdminModel");
const userModel = require("../models/userModel");
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
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Account Not Found" });
    }

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

exports.isNotUser = async (req, res, next) => {
  try {
    const admin = await adminModel.findById(req.userId).select("+password");
    const subAdmin = await subAdminModel
      .findById(req.userId)
      .select("+password");
    if (!admin && !subAdmin) {
      return res.status(401).json({ message: "Admin/SubAdmin not found" });
    }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized:Admin/SubAdmin Only" });
  }
};
