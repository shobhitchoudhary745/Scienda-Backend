const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { sendEmail } = require("../utils/sendEmail");
const { s3Uploadv2 } = require("../utils/s3");
const userModel = require("../models/userModel");

const sendData = async (user, statusCode, res, purpose) => {
  const token = await user.getJWTToken();
  const newUser = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    mobile: user.mobile,
    is_verfied: user.is_verfied,
    _id: user._id,
    profile_url: user.profile_url,
  };
  if (purpose) {
    res.status(statusCode).json({
      status: "otp send successfully",
    });
  } else {
    res.status(statusCode).json({
      user: newUser,
      token,
      status: "user login successfully",
    });
  }
};

exports.register = catchAsyncError(async (req, res, next) => {
  const {
    first_name,
    last_name,
    dob,
    email,
    password,
    mobile,
    domain,
    subdomain,
  } = req.body;

  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  const existingUser = await userModel.findOne({ email, is_verfied: true });
  if (existingUser)
    return next(new ErrorHandler("User Already Exist with this email", 400));

  if (
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !mobile ||
    !dob ||
    !domain ||
    !subdomain
  ) {
    return next(new ErrorHandler("All fieleds are required"));
  }

  const user = await userModel.create({
    first_name,
    last_name,
    dob,
    email,
    password,
    mobile,
    otp,
    domain,
    subdomain,
  });

  const options = {
    email: email.toLowerCase(),
    subject: "Email Verification",
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Account Verification Code</h1>
      <p style="color: #666666;">Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to verify your Account</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Scienda</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
  sendData(user, 201, res, "register");
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel
    .findOne({ email: email.toLowerCase() })
    .select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));
  if (!user.isEmailVerfied) {
    return next(new ErrorHandler("Verify Your Email before login.", 403));
  }

  sendData(user, 200, res);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const user = await userModel.findByIdAndDelete(id);
  if (!user) return next(new ErrorHandler("User not found", 400));
  res.status(200).send({ success: true, message: "User Deleted" });
});

exports.getOtpToForgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.params;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User Not Exist with this Email!", 401));
  }
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

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
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
  };
  const send = await sendEmail(options);
  if (send) {
    user.otp = otp;
    await user.save();
    res.status(200).send({
      message: "OTP Send Successfully",
      status: 200,
      success: true,
    });
  } else {
    res.status(500).send({
      message: "Internal Server Error",
      status: 500,
      success: false,
    });
  }
});

exports.submitOtpToForgotPassword = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({
    email,
    otp,
  });
  if (user) {
    // user.password = password;
    user.otp = 0;
    await user.save();
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
  const user = await userModel
    .findOne({
      email,
    })
    .select("+password");
  const isPasswordMatched = await user.comparePassword(password);
  if (isPasswordMatched) {
    return next(new ErrorHandler("New Password is same as Old Password", 400));
  }
  // console.log(user);
  if (user && user.otp == 0) {
    user.password = password;
    // user.otp = 0;
    await user.save();
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

exports.submitOtpForEmailVerification = catchAsyncError(
  async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await userModel.findOne({
      email,
      otp,
    });
    if (user) {
      user.otp = 0;
      user.isEmailVerfied = true;
      await user.save();
      const token = await user.getJWTToken();
      const newUser = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile,
        is_verfied: user.is_verified,
        _id: user._id,
        profile_url: user.profile_url,
      };
      res.status(202).send({
        status: 202,
        token,
        user: newUser,
        success: true,
        message: "Email Verified Successfully!",
      });
    } else {
      res.status(400).send({
        status: 400,
        success: false,
        message: "Invalid OTP!",
      });
    }
  }
);

exports.getMyProfile = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const user = await userModel.findById(id).lean();
  if (!user) {
    return next(new ErrorHandler("Invalid token", 400));
  }
  res.status(200).send({
    success: true,
    user,
  });
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send({
      success: false,
      message: "Password not match with Confirm password",
    });
  }
  const user = await userModel.findById(id).select("+password");
  const isPasswordMatched = await user.comparePassword(password);
  if (isPasswordMatched) {
    return next(new ErrorHandler("New Password is same as Old Password", 400));
  }
  user.password = password;
  await user.save();
  res.status(202).send({
    status: "Password changed successfully",
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const file = req.file;
  let location;
  if (file) {
    const results = await s3Uploadv2(file);
    location = results.Location && results.Location;
  }
  const { mobile, first_name, last_name } = req.body;

  const user = await userModel.findById(id);
  if (mobile) user.mobile = mobile;

  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (location) user.profile_url = location;

  await user.save();
  res.status(202).send({
    status: "Profile updated successfully",
  });
});

exports.getAllUser = catchAsyncError(async (req, res, next) => {
  const users = await userModel
    .find({ _id: { $ne: req.userId }, type: "User" })
    .lean();
  res.status(200).send({
    success: true,
    length: users.length,
    users,
  });
});

exports.resendOtp = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not Found", "400"));
  }
  if (user.isEmailVerfied) {
    return next(new ErrorHandler("Email already verified", "400"));
  }

  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  user.otp = otp;
  await user.save();
  const options = {
    email: email.toLowerCase(),
    subject: "Email Verification",
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Account Verification Code</h1>
      <p style="color: #666666;">Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to verify your Account</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
  res.status(200).send({
    success: "true",
    message: "otp resend successfully",
  });
});
