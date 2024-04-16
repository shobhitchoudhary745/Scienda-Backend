const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.registerSubAdmin = catchAsyncError(async (req, res, next) => {
  const {
    name,
    email,
    password,
    profile_url,
    address,
    dob,
    joining_date,
    domain,
    sub_domain,
    mobile,
    professor_id,
  } = req.body;
  const existingSubAdmin = await subAdminModel.findOne({
    $or: [{ email: email }, { professor_id: professor_id }],
  });
  if (existingSubAdmin) {
    return next(new ErrorHandler("Email/ProfessorId is Already Exist", 400));
  }

  const subAdmin = await subAdminModel.create({
    name,
    email,
    password,
    profile_url,
    address,
    dob,
    joining_date,
    domain,
    sub_domain,
    mobile,
    professor_id,
  });

  await subAdmin.save();

  res.status(200).json({
    success: true,
    message: "Subadmin Created Successfully",
  });
});

exports.subAdminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const subAdmin = await subAdminModel.findOne({ email }).select("+password");
  if (!subAdmin) {
    return next(new ErrorHandler("Invalid Credentials", 400));
  }

  const isMatch = await subAdmin.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid Credentials", 400));
  }

  const token = await subAdmin.getToken();
  subAdmin.password = undefined;
  res.status(200).json({
    success: true,
    subAdmin,
    token,
    message: "Sub Admin Login Successfully",
  });
});

exports.getAllSubAdmin = catchAsyncError(async (req, res, next) => {
  const professors = await subAdminModel.find().populate("domain").populate("sub_domain").lean();
  res.status(200).json({
    success: true,
    professors,
    message: "Professor Fetched Successfully",
  });
});
