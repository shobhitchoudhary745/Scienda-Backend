const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { sendEmail, sendInvoice } = require("../utils/sendEmail");
const { s3Uploadv2, s3UploadPdf } = require("../utils/s3");
const userModel = require("../models/userModel");
const reportModel = require("../models/reportModel");
const topicModel = require("../models/topicModel");
const subTopicModel = require("../models/subTopicModel");
const mongoose = require("mongoose");
const questionsModel = require("../models/questionsModel");
const testModel = require("../models/testModel");
const ticketModel = require("../models/ticketModel");
const transactionModel = require("../models/transactionModel");
const adminModel = require("../models/adminModel");
const subAdminModel = require("../models/subAdminModel");
const subDomainModel = require("../models/subDomainModel");

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
    is_active_plan: user.is_active_plan,
    domain: user.domain,
    subdomain: user.subdomain,
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
  const { first_name, last_name, dob, email, password, mobile, subdomain } =
    req.body;
  const exist_subdomain = await subDomainModel.findOne({
    domain_url: subdomain,
  });
  if (!exist_subdomain)
    return next(new ErrorHandler("This Subdomain is not exist", 400));
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  const existingUser = await userModel.findOne({
    email: email.toLowerCase().trim(),
    is_verfied: true,
  });
  if (existingUser)
    return next(new ErrorHandler("User Already Exist with this email", 400));

  const admin = await adminModel.findOne({ email: email.toLowerCase().trim() });
  if (admin)
    return next(new ErrorHandler("Admin can not be Registered as User", 400));

  const subadmin = await subAdminModel.findOne({
    email: email.toLowerCase().trim(),
  });
  if (subadmin)
    return next(
      new ErrorHandler("Professor can not be Registered as User", 400)
    );

  if (
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !mobile ||
    !dob ||
    !exist_subdomain._id
  ) {
    return next(new ErrorHandler("All fields are required"));
  }

  const user = await userModel.create({
    first_name,
    last_name,
    dob,
    email: email.toLowerCase().trim(),
    password,
    mobile,
    otp,
    domain: exist_subdomain?.domain_reference,
    subdomain: exist_subdomain._id,
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
  const { email, password, host } = req.body;
  const subdomain = await subDomainModel.findOne({ domain_url: host });
  if (!subdomain) {
    return next(new ErrorHandler("Subdomain not Found", 400));
  }
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel
    .findOne({ email: email.toLowerCase(), is_verified: true })
    .select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));
  if (!user.is_verified) {
    return next(new ErrorHandler("Verify Your Email before login.", 403));
  }
  if (user?.subdomain?.toString() != subdomain._id.toString()) {
    return next(
      new ErrorHandler("User is not registererd in this domain", 400)
    );
  }

  sendData(user, 200, res);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const user = await userModel.findByIdAndDelete(id);
  await ticketModel.deleteMany({ from: id });
  if (!user) return next(new ErrorHandler("User not found", 400));
  res.status(200).send({ success: true, message: "User Deleted" });
});

exports.getOtpToForgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
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
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Scienda</span></p>
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
      user.is_verified = true;
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
        is_active_plan: user.is_active_plan,
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
  const { password, confirm_password, old_password } = req.body;
  if (password !== confirm_password) {
    return res.status(400).send({
      success: false,
      message: "Password not match with Confirm password",
    });
  }
  const user = await userModel.findById(id).select("+password");
  const isPasswordMatched = await user.comparePassword(old_password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("You Enter Wrong Old Password", 400));
  }
  if (old_password == password) {
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
    location = results.Location.split(".com")[1];
  }
  const { mobile, first_name, last_name, dob } = req.body;

  const user = await userModel.findById(id);
  if (mobile) user.mobile = mobile;

  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (dob) user.dob = dob;
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

exports.sendInvoice = catchAsyncError(async (req, res, next) => {
  req.userId = "Rachit Patel";
  const data = await sendInvoice(
    {
      name: "Shobhit",
      email: "shobhitchoudhary745@gmail.com",
      _id: "demoidvgvgvg",
      mobile: 7898062538,
    },
    {
      _id: "65e5c981471c00a09b2e3218",
      order: "65e5c92c0939ce882644899b",
      user: "65e5c9060939ce882644898f",
      payment_id: "pay_NiI6swHNH4e8m4",
      gateway: "Razorpay",
      amount: 1737,
      status: "COMPLETED",
      invoice_url:
        "https://adelaide-car.s3.amazonaws.com/uploads/user-65e5c9060939ce88264…",
      createdAt: "2024-04-04T13:15:48.506+00:00",
      updatedAt: "2024-03-04T13:15:48.506+00:00",
      __v: 0,
    },
    "Euro"
  );

  const data2 = await s3UploadPdf(data, "userid");

  // const location = await s3Uploadv4(data, "dummyuserid");
  res.status(200).json({
    success: true,
    data: data2,
    // location,
    // data,
  });
});

exports.viewProficiencys = catchAsyncError(async (req, res, next) => {
  const reports = await reportModel
    .find({ user: req.userId })
    .populate({
      path: "test",
      select: ["duration_in_mins", "test_name"],
    })
    .lean();

  res.status(200).json({
    success: true,
    message: "reports Fetched Successfully",
    reports,
  });
});

exports.viewProficiency = catchAsyncError(async (req, res, next) => {
  const report = await reportModel
    .findById(req.params.id)
    .populate({
      path: "test",
      populate: {
        path: "questions_reference",
        select: ["sub_topic_reference"],
        populate: {
          path: "sub_topic_reference",
          select: ["topic_reference", "sub_topic_name"],
          populate: {
            path: "topic_reference",
            select: ["topic_name"],
          },
        },
      },
    })
    .lean();

  const data = {};
  data.exam_name = report.test.test_name;
  data.overall_percentage = report.percentage;
  data.topic_wise = {};

  for (let answer in report.answers) {
    const topic =
      report.test.questions_reference[answer].sub_topic_reference
        .topic_reference.topic_name;
    const subtopic =
      report.test.questions_reference[answer].sub_topic_reference
        .sub_topic_name;
    if (!data.topic_wise[topic]) {
      data.topic_wise[topic] = {};
      data.topic_wise[topic].count = 1;
      if (report.answers[answer].status === "Correct")
        data.topic_wise[topic].correct_count = 1;
      else data.topic_wise[topic].correct_count = 0;
      data.topic_wise[topic].percent =
        (data.topic_wise[topic].correct_count * 100) /
        data.topic_wise[topic].count;
      if (!data.topic_wise[topic][subtopic]) {
        data.topic_wise[topic][subtopic] = {};
        data.topic_wise[topic][subtopic].count = 1;
        if (report.answers[answer].status === "Correct") {
          data.topic_wise[topic][subtopic].correct_count = 1;
        } else data.topic_wise[topic][subtopic].correct_count = 0;
        data.topic_wise[topic][subtopic].percent =
          (data.topic_wise[topic][subtopic].correct_count * 100) /
          data.topic_wise[topic][subtopic].count;
      } else {
        data.topic_wise[topic][subtopic].count += 1;
        if (report.answers[answer].status === "Correct") {
          data.topic_wise[topic][subtopic].correct_count += 1;
        }
        data.topic_wise[topic][subtopic].percent =
          (data.topic_wise[topic][subtopic].correct_count * 100) /
          data.topic_wise[topic][subtopic].count;
      }
    } else {
      data.topic_wise[topic].count += 1;
      if (report.answers[answer].status === "Correct")
        data.topic_wise[topic].correct_count += 1;
      data.topic_wise[topic].percent =
        (data.topic_wise[topic].correct_count * 100) /
        data.topic_wise[topic].count;
      if (!data.topic_wise[topic][subtopic]) {
        data.topic_wise[topic][subtopic] = {};
        data.topic_wise[topic][subtopic].count = 1;
        if (report.answers[answer].status === "Correct") {
          data.topic_wise[topic][subtopic].correct_count = 1;
        } else data.topic_wise[topic][subtopic].correct_count = 0;
        data.topic_wise[topic][subtopic].percent =
          (data.topic_wise[topic][subtopic].correct_count * 100) /
          data.topic_wise[topic][subtopic].count;
      } else {
        data.topic_wise[topic][subtopic].count += 1;
        if (report.answers[answer].status === "Correct") {
          data.topic_wise[topic][subtopic].correct_count += 1;
        }
        data.topic_wise[topic][subtopic].percent =
          (data.topic_wise[topic][subtopic].correct_count * 100) /
          data.topic_wise[topic][subtopic].count;
      }
    }
  }

  let arr = [];
  for (let topic of Object.keys(data.topic_wise)) {
    arr.push({ topic: topic, ...data.topic_wise[topic] });
  }
  data.topic_wise = arr;
  for (let subtopic of data.topic_wise) {
    const obj = { ...subtopic };
    delete obj.topic;
    delete obj.count;
    delete obj.correct_count;
    delete obj.percent;
    let arr2 = [];
    for (let subs of Object.keys(obj)) {
      arr2.push({ subtopic: subs, ...subtopic[subs] });
      delete subtopic[subs];
    }
    subtopic.subtopic = arr2;
  }

  res.status(200).json({
    success: true,
    message: "report Fetched Successfully",
    data,
  });
});

exports.getSubtopics = catchAsyncError(async (req, res, next) => {
  const { key } = req.query;
  let topics = await topicModel
    .find({ sub_domain_reference: req.params.id })
    .lean();

  if (key) {
    topics = topics.filter((topic) =>
      topic.topic_name.toLowerCase().trim().includes(key.toLowerCase().trim())
    );
  }

  for (let topic of topics) {
    const subtopics = await subTopicModel
      .find({ topic_reference: topic._id })
      .lean();
    topic.subtopic_count = subtopics.length;
    if (subtopics.length) {
      let question = 0;
      for (let subtopic of subtopics) {
        const questionCount = await questionsModel.countDocuments({
          sub_topic_reference: subtopic._id,
        });
        question += questionCount;
      }
      topic.questionCount = question;
    } else {
      topic.questionCount = 0;
    }
  }

  res.status(200).json({
    success: true,
    message: "report Fetched Successfully",
    topics,
  });
});

exports.getTopic = catchAsyncError(async (req, res, next) => {
  const topic = await topicModel.findById(req.params.id).lean();

  const subtopics = await subTopicModel
    .find({ topic_reference: topic._id })
    .lean();
  topic.subtopic_count = subtopics.length;
  topic.subtopics = subtopics;
  if (subtopics.length) {
    let question = 0;
    for (let subtopic of subtopics) {
      const questionCount = await questionsModel.countDocuments({
        sub_topic_reference: subtopic._id,
      });
      question += questionCount;
      subtopic.questionCount = questionCount;
    }
    topic.questionCount = question;
  } else {
    topic.questionCount = 0;
  }

  res.status(200).json({
    success: true,
    message: "report Fetched Successfully",
    topic,
  });
});

exports.getTestGraphData = catchAsyncError(async (req, res, next) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentYear = new Date().getFullYear();
  const reports = await reportModel.find({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
    },
    user: req.userId,
  });
  const monthlyUserCounts = Array(12).fill(0);

  reports.forEach((report) => {
    const month = new Date(report.createdAt).getMonth();
    monthlyUserCounts[month]++;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Users Test data fetch Successfully",
  });
});

exports.getPieChart = catchAsyncError(async (req, res, next) => {
  const [report] = await reportModel
    .find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .populate("test", "test_name");
  const data = {};

  if (report) {
    data.test_name = report.test.test_name;
    data.confidence = report.confidence;
    data.total = report.total;
    data.correct_answer = report.correct_answers;
    data["THINK SO"] = 0;
    data["I KNOW IT"] = 0;
    data["NOT SURE"] = 0;
    data["NO IDEA"] = 0;

    report.answers.forEach((val) => {
      if (val.comment === "THINK SO") data["THINK SO"] += 1;
      if (val.comment === "I KNOW IT") data["I KNOW IT"] += 1;
      if (val.comment === "NOT SURE") data["NOT SURE"] += 1;
      if (val.comment === "NO IDEA") data["NO IDEA"] += 1;
    });
  }

  const graphdata = [];
  graphdata.push({
    label: "I Know It",
    value: data["I KNOW IT"],
    color: "#007C23",
  });
  graphdata.push({
    label: "Think So",
    value: data["THINK SO"],
    color: "#92FF3C",
  });
  graphdata.push({
    label: "Not Sure",
    value: data["NOT SURE"],
    color: "#E58D08",
  });
  graphdata.push({
    label: "No Idea",
    value: data["NO IDEA"],
    color: "#EA0000",
  });

  data.graphdata = graphdata;

  res.status(200).json({
    success: true,
    data,
    message: "Graph data fetch Successfully",
  });
});

exports.getConfidenceData = catchAsyncError(async (req, res, next) => {
  const uData = [],
    pData = [],
    xLabels = [];
  let reports = await reportModel
    .find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("test", "test_name");

  const arr = [];
  const arr1 = [];
  reports.forEach((report) => {
    if (!arr.includes(report.test._id.toString())) {
      arr.push(report.test._id.toString());
      arr1.push(report._id.toString());
    }
  });

  reports = reports.filter((report) => arr1.includes(report._id.toString()));

  reports;

  reports.forEach((report) => {
    uData.push(
      parseFloat((report.correct_answers * 100) / report.total).toFixed(2)
    );
    pData.push(parseFloat(report.confidence).toFixed(2));
    xLabels.push(report.test.test_name);
  });

  res.status(200).json({
    success: true,
    data: {
      uData,
      pData,
      xLabels,
    },
    message: "Graph data fetch Successfully",
  });
});

exports.getQuestionGraphData = catchAsyncError(async (req, res, next) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentYear = new Date().getFullYear();
  const reports = await reportModel.find({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
    },
    user: req.userId,
  });
  const monthlyUserCounts = Array(12).fill(0);

  reports.forEach((report) => {
    const month = new Date(report.createdAt).getMonth();
    monthlyUserCounts[month] += report.total - report.unattempt;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Users Question data fetch Successfully",
  });
});

exports.getUserDashboardData = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
  const [tests, tickets, reports, subscription, quizCount, examCount] =
    await Promise.all([
      testModel
        .find({ subdomain_reference: subdomain, status: "Active" })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ticketModel
        .find({ from: req.userId, status: "Pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      reportModel
        .find({ user: req.userId })
        .populate("test")
        .sort({ createdAt: -1 })
        .lean(),
      transactionModel.findOne({ user: req.userId, status: "Active" }).lean(),
      testModel.countDocuments({
        subdomain_reference: subdomain,
        test_type: "Quiz",
        status: "Active",
      }),
      testModel.countDocuments({
        subdomain_reference: subdomain,
        test_type: "Exam",
        status: "Active",
      }),
    ]);

  const reportArray = reports.map((report) => report.test._id.toString());
  for (let test of tests) {
    if (reportArray.includes(test._id.toString())) {
      test.attempted = true;
    } else {
      test.attempted = false;
    }
  }
  res.status(200).json({
    success: true,
    data: {
      tests,
      tickets,
      reports: reports.slice(0, 5),
      subscription: subscription ? subscription : {},
      quizCount,
      examCount,
      totalExam: quizCount + examCount,
    },
    message: "Users Dashboard data fetch Successfully",
  });
});
