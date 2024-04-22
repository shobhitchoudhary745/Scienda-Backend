const adminModel = require("../models/adminModel");
const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");

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

  const token = await admin.getToken();
  admin.password = undefined;
  res.status(200).json({
    success: true,
    admin,
    token,
    message: "Admin Login Successfully",
  });
});

exports.getSubAdminProfile = catchAsyncError(async (req, res, next) => {
  const professor = await subAdminModel
    .findById(req.params.id)
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

exports.subAdminUpdateProfile = catchAsyncError(async (req, res, next) => {
  const {
    address,
    mobile,
    domain,
    sub_domain,
    joining_date,
    dob,
    professor_id,
    name,
  } = req.body;
  const subAdmin = await subAdminModel.findById(req.params.id);
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
  if (domain) subAdmin.domain = domain;
  if (sub_domain) subAdmin.sub_domain = sub_domain;
  if (joining_date) subAdmin.joining_date = joining_date;
  if (dob) subAdmin.dob = dob;
  if (professor_id) subAdmin.professor_id = professor_id;
  if (name) subAdmin.name = name;
  if (location) subAdmin.profile_url = location;
  await subAdmin.save();
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});
