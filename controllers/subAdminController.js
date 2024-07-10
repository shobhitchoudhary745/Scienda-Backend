const subAdminModel = require("../models/subAdminModel");
const questionModel = require("../models/questionsModel");
const testModel = require("../models/testModel");
const salaryModel = require("../models/salaryModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");
const { sendEmail } = require("../utils/sendEmail");
const subadminNotification = require("../models/subadminNotificationModel");
const userModel = require("../models/userModel");
const modifiedQuestion = require("../models/questionToBeModified");
const transactionModel = require("../models/transactionModel");
const ticketModel = require("../models/ticketModel");

exports.registerSubAdmin = catchAsyncError(async (req, res, next) => {
  const {
    first_name,
    last_name,
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
    $or: [{ email: email }],
  });
  if (existingSubAdmin) {
    return next(new ErrorHandler("Email/ProfessorId is Already Exist", 400));
  }

  const subAdmin = await subAdminModel.create({
    first_name,
    last_name,
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
  const totalProf = await subAdminModel.countDocuments();
  const activeProf = await subAdminModel.countDocuments({ is_blocked: false });
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
    totalProf,
    activeProf,
    message: "Professor Fetched Successfully",
  });
});

exports.subAdminUpdateProfile = catchAsyncError(async (req, res, next) => {
  const { address, mobile, first_name, last_name, dob } = req.body;
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
  if (first_name) subAdmin.first_name = first_name;
  if (last_name) subAdmin.last_name = last_name;
  if (dob) subAdmin.dob = dob;
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
  const subAdmin = await subAdminModel
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

exports.getStatics = catchAsyncError(async (req, res, next) => {
  const { subdomain, professor } = req.query;

  const questionToBeModified = await modifiedQuestion.countDocuments({
    subdomain,
  });

  const registeredUser = await userModel.countDocuments({
    subdomain,
  });

  const questions = await questionModel
    .find({})
    .populate({
      path: "sub_topic_reference",
      populate: {
        path: "topic_reference",
        populate: {
          path: "sub_domain_reference",
        },
      },
    })
    .lean();

  // console.log("279 ", questions.length);
  const salarys = await salaryModel.find({ professor }).lean();
  const tests = await testModel.find({ subdomain_reference: subdomain }).lean();

  const obj = {};
  obj.tests_statics = {};
  obj.questions_statics = {};
  obj.users_statics = {};
  obj.payroll_statics = {};
  obj.users_statics.registeredUser = registeredUser;

  for (let test of tests) {
    if (test.createdAt != test.updatedAt) {
      if (obj.tests_statics.testmodified) obj.tests_statics.testmodified += 1;
      else obj.tests_statics.testmodified = 1;
    }
    if (test.timed_out) {
      if (obj.tests_statics.timedout) obj.tests_statics.timedout += 1;
      else obj.tests_statics.timedout = 1;
    }
  }

  obj.questions_statics.question_tobe_modified = questionToBeModified;

  obj.questions_statics.total_test = tests.length;

  for (let question of questions) {
    if (
      subdomain ==
      question.sub_topic_reference.topic_reference.sub_domain_reference._id.toString()
    ) {
      !obj.questions_statics.total_question
        ? (obj.questions_statics.total_question = 1)
        : (obj.questions_statics.total_question += 1);
      if (question.createdAt != question.updatedAt) {
        if (obj.questions_statics.modifiedquestion)
          obj.questions_statics.modifiedquestion += 1;
        else obj.questions_statics.modifiedquestion = 1;
      }
    }
  }

  for (let salary of salarys) {
    if (obj.payroll_statics.total_salary) {
      obj.payroll_statics.total_salary += salary.amount;
    } else obj.payroll_statics.total_salary = salary.amount;
  }
  obj.payroll_statics.numberofsalary = salarys.length;
  if (!obj.tests_statics.timedout) obj.tests_statics.timedout = 0;
  if (!obj.questions_statics.modifiedquestion)
    obj.questions_statics.modifiedquestion = 0;
  res.status(200).send({
    statics: obj,
    message: "Data fetched Successfully",
  });
});

exports.getModifiedTest = catchAsyncError(async (req, res, next) => {
  const tests = await testModel
    .find({
      $expr: {
        $ne: ["$createdAt", "$updatedAt"],
      },
      subdomain_reference: req.query.subdomain,
    })
    .populate({
      path: "questions_reference",
      populate: {
        path: "sub_topic_reference",
        populate: {
          path: "topic_reference",
        },
      },
    })
    .lean();

  res.status(200).send({
    tests,
    message: "Modified Tests fetched Successfully",
  });
});

exports.getModifiedQuestion = catchAsyncError(async (req, res, next) => {
  const questions = await questionModel
    .find({
      $expr: {
        $ne: ["$createdAt", "$updatedAt"],
      },
      sub_topic_reference: req.query.subtopic,
    })
    .lean();

  res.status(200).send({
    questions,
    message: "Modified Questions fetched Successfully",
  });
});

exports.getQuestionsGraphData = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
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
  let questions = await questionModel
    .find({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
      },
    })
    .populate({
      path: "sub_topic_reference",
      populate: {
        path: "topic_reference",
      },
    })
    .lean();
  // console.log("406 ", questions.length);
  questions = questions.filter(
    (question) =>
      question.sub_topic_reference.topic_reference.sub_domain_reference ==
      subdomain
  );
  // console.log("413 ", questions.length);
  const monthlyUserCounts = Array(12).fill(0);

  questions.forEach((question) => {
    const month = new Date(question.createdAt).getMonth(); // getMonth() returns 0 for January, 1 for February, etc.
    monthlyUserCounts[month]++;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Questions data fetch Successfully",
  });
});

exports.getTestsGraphData = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
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

  const tests = await testModel
    .find({
      subdomain_reference: subdomain,
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
      },
    })
    .lean();

  const monthlyUserCounts = Array(12).fill(0);

  tests.forEach((test) => {
    const month = new Date(test.createdAt).getMonth(); // getMonth() returns 0 for January, 1 for February, etc.
    monthlyUserCounts[month]++;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Tests data fetch Successfully",
  });
});

exports.getUserGraphData = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
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
  const users = await userModel
    .find({
      subdomain,
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
      },
    })
    .lean();
  const monthlyUserCounts = Array(12).fill(0);

  users.forEach((user) => {
    const month = new Date(user.createdAt).getMonth(); // getMonth() returns 0 for January, 1 for February, etc.
    monthlyUserCounts[month]++;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Users data fetch Successfully",
  });
});

exports.getSalaryGraphData = catchAsyncError(async (req, res, next) => {
  // const { subdomain } = req.query;
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
  const salarys = await salaryModel
    .find({
      professor: req.userId,
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
      },
    })
    .lean();
  const monthlyUserCounts = Array(12).fill(0);

  salarys.forEach((salary) => {
    const month = new Date(salary.createdAt).getMonth();
    monthlyUserCounts[month] += salary.amount;
  });

  const data = monthlyUserCounts.map((count, index) => ({
    month: months[index],
    count,
  }));

  res.status(200).json({
    success: true,
    data: data.slice(0, new Date().getMonth() + 1),
    message: "Salarys data fetch Successfully",
  });
});

exports.questionToBeModified = catchAsyncError(async (req, res, next) => {
  const questions = await modifiedQuestion
    .find({
      subdomain: req.query.subdomain,
    })
    .populate("question")
    .populate("subdomain")
    .lean();

  res.status(200).send({
    questions,
    message: "Questions To Be modified fetched Successfully",
  });
});

exports.getTimedOutTest = catchAsyncError(async (req, res, next) => {
  const tests = await testModel
    .find({
      timed_out: true,
      subdomain_reference: req.query.subdomain,
    })
    .populate({
      path: "questions_reference",
      populate: {
        path: "sub_topic_reference",
        populate: {
          path: "topic_reference",
        },
      },
    })
    .lean();

  res.status(200).send({
    tests,
    message: "Timed Out Tests fetched Successfully",
  });
});

exports.getDashboardData = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const currentMonthAmount = await transactionModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const currentYearAmount = await transactionModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const [currentMonthUser, currentYearUser] = await Promise.all([
    userModel.countDocuments({
      subdomain,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    userModel.countDocuments({
      subdomain,
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
  ]);

  const [currentMonthTest, currentYearTest] = await Promise.all([
    testModel.countDocuments({
      subdomain_reference: subdomain,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    testModel.countDocuments({
      subdomain_reference: subdomain,
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
  ]);

  const [tests, subscriptions, tickets, question] = await Promise.all([
    testModel
      .find({
        subdomain_reference: subdomain,
      })
      .populate({
        path: "questions_reference",
        populate: {
          path: "sub_topic_reference",
          populate: {
            path: "topic_reference",
          },
        },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    transactionModel
      .find({ subdomain })
      .sort({ createdAt: -1 })
      .populate("user", "first_name last_name profile_url")
      .limit(5)
      .lean(),
    ticketModel
      .find({ to: req.userId })
      .sort({ createdAt: -1 })
      .populate("from", "first_name last_name profile_url")
      .limit(5)
      .lean(),
    questionModel
      .find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "sub_topic_reference",
        populate: {
          path: "topic_reference",
        },
      })
      .lean(),
  ]);

  let questions = question.filter(
    (ques) =>
      ques.sub_topic_reference.topic_reference.sub_domain_reference.toString() ==
      subdomain
  );

  let currentMonthQuestion = 0,
    currentYearQuestion = 0;

  for (let question of questions) {
    if (
      question.createdAt >= startOfMonth &&
      question.createdAt <= endOfMonth
    ) {
      currentMonthQuestion += 1;
    }

    if (question.createdAt >= startOfYear && question.createdAt <= endOfYear) {
      currentYearQuestion += 1;
    }
  }

  res.status(200).send({
    userCount: { currentMonthUser, currentYearUser },
    testCount: { currentMonthTest, currentYearTest },
    transactionCount: {
      currentMonthAmount:
        currentMonthAmount.length > 0 ? currentMonthAmount[0].totalAmount : 0,
      currentYearAmount:
        currentYearAmount.length > 0 ? currentYearAmount[0].totalAmount : 0,
    },
    questionCount: { currentMonthQuestion, currentYearQuestion },
    tests,
    subscriptions,
    tickets,
    questions: questions.slice(0, 5),
    message: "Dashboard Data fetched Successfully",
  });
});
