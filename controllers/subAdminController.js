const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");

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

exports.getSubAdminProfile = catchAsyncError(async (req, res, next) => {
  const professor = await subAdminModel
    .findById(req.userId)
    .select("-password")
    .populate("domain")
    .populate("sub_domain")
    .lean();
  res.status(200).json({
    success: true,
    professor,
    message: "Professor Fetched Successfully",
  });
});

exports.getAllSubAdmin = catchAsyncError(async (req, res, next) => {
  const professors = await subAdminModel
    .find()
    .select("-password")
    .populate("domain")
    .populate("sub_domain")
    .lean();
  res.status(200).json({
    success: true,
    professors,
    message: "Professor Fetched Successfully",
  });
});

exports.subAdminUpdateProfile = catchAsyncError(async (req, res, next) => {
  const { address, mobile } = req.body;
  const subAdmin = await subAdminModel.findById(req.userId);
  if (!subAdmin) {
    return next(new ErrorHandler("Invalid Credentials", 400));
  }
  let location = "";
  if (req.file) {
    const result = await s3Uploadv2(req.file);
    location = result.Location.split(".com")[1];
  }

  if (address) subAdmin.address = address;
  if (mobile) subAdmin.mobile = mobile;
  if (location) subAdmin.profile_url = location;
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});
