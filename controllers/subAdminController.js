const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");
const { sendEmail } = require("../utils/sendEmail");
const subadminNotification = require("../models/subadminNotificationModel");

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
    pay_percent,
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
    pay_percent,
  });

  await subAdmin.save();
  await subadminNotification.create({ owner: subAdmin._id });

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
  const { key, resultPerPage, currentPage } = req.query;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) {
    query.$or = [
      { name: { $regex: new RegExp(key, "i") } },
      { email: { $regex: new RegExp(key, "i") } },
      { professor_id: { $regex: new RegExp(key, "i") } },
    ];
  }

  const findQuery = subAdminModel
    .find(query)
    .select("-password")
    .populate("domain")
    .populate("sub_domain")
    .skip(skip);

  if (limit) {
    findQuery.limit(limit);
  }
  const professors = await findQuery.lean();

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
  await subAdmin.save();
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

exports.getOtp = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const subAdmin = await subAdminModel.findOne({ email });
  if (!subAdmin) {
    return next(new ErrorHandler("subAdmin Not Exist with this Email!", 401));
  }
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  subAdmin.otp = otp;
  await subAdmin.save();
  const options = {
    email: email.toLowerCase(),
    subject: "Forgot Password Request",
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Forgot Password Code</h1>
      <p style="color: #666666;">Your one time code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to Forgot your Password</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Scienda</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
  res.status(200).json({
    success: true,
    message: "Otp Send Successfully",
  });
});

exports.submitOtp = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  const subAdmin = await subAdminModel.findOne({
    email,
    otp,
  });
  if (subAdmin) {
    subAdmin.otp = 1;
    await subAdmin.save();
    res.status(202).send({
      status: 202,
      success: true,
      message: "Otp Verify Successfully!",
    });
  } else {
    res.status(400).send({
      status: 400,
      success: false,
      message: "Invalid otp!",
    });
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const subAdmin = await adminModel
    .findOne({
      email,
    })
    .select("+password");
  const isPasswordMatched = await subAdmin.matchPassword(password);
  if (isPasswordMatched) {
    return next(new ErrorHandler("New Password is same as Old Password", 400));
  }
  if (subAdmin && subAdmin.otp == 1) {
    subAdmin.password = password;
    subAdmin.otp = null;
    await subAdmin.save();
    res.status(202).send({
      status: 202,
      success: true,
      message: "Password Changed Successfully!",
    });
  } else {
    res.status(400).send({
      status: 400,
      success: false,
      message: "Invalid otp!",
    });
  }
});
