const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const ErrorHandler = require("../utils/errorHandler");
const adminModel = require("../models/adminModel");
const subAdminModel = require("../models/subAdminModel");
dotenv.config({ path: "../config/config.env" });

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization || !req.headers.token) {
      return res.status(401).json({ message: `Authentication Expired` });
    }

    let token = "";
    if (req.headers.token) {
      token = req.headers.token.split(" ")[1];
    } else {
      token = req.headers.authorization.split(" ")[1];
    }
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

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
