const adminModel = require("../models/adminModel");
const subAdminModel = require("../models/subAdminModel");
const ticketModel = require("../models/ticketModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");
const { sendEmail } = require("../utils/sendEmail");

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

exports.getOtp = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const admin = await adminModel.findOne({ email });
  if (!admin) {
    return next(new ErrorHandler("Admin Not Exist with this Email!", 401));
  }
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  admin.otp = otp;
  await admin.save();
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
  const admin = await adminModel.findOne({
    email,
    otp,
  });
  if (admin) {
    admin.otp = 1;
    await admin.save();
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
  const admin = await adminModel
    .findOne({
      email,
    })
    .select("+password");
  const isPasswordMatched = await admin.matchPassword(password);
  if (isPasswordMatched) {
    return next(new ErrorHandler("New Password is same as Old Password", 400));
  }
  if (admin && admin.otp == 1) {
    admin.password = password;
    admin.otp = null;
    await admin.save();
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

exports.getTickets = catchAsyncError(async (req, res, next) => {
  const {status} = req.query;
  const query = {};
  if (status) query.status = status;
  const tickets = await ticketModel
    .find(query)
    .populate("to")
    .populate("from")
    .populate("subdomain")
    .lean();
  res.status(200).json({
    success: true,
    tickets,
    message: "Tickets Fetched Successfully",
  });
});

exports.getTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel
    .findById(req.params.id)
    .populate("to")
    .populate("from")
    .populate("subdomain")
    .lean();
  res.status(200).json({
    success: true,
    ticket,
    message: "Ticket Fetched Successfully",
  });
});
