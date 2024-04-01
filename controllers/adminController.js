const adminModel = require("../models/adminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.registerAdmin = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const admin = await adminModel.create({ name, email, password });

  await admin.save();

  res.status(200).json({
    success: true,
    message: "Admin Created Successfully",
  });
});

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const admin = await adminModel.findOne({ email }).select("+password");
  if (!admin) {
    return next(new ErrorHandler("Invalid Credentials", 400));
  }

  const isMatch = await admin.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid Credentials", 400));
  }

  const token = await admin.getToken()
  admin.password=undefined
  res.status(200).json({
    success: true,
    admin,
    token,
    message: "Admin Login Successfully",
  });
});
