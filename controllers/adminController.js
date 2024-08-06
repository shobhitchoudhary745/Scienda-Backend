const adminModel = require("../models/adminModel");
const questionsModel = require("../models/questionsModel");
const subAdminModel = require("../models/subAdminModel");
const testModel = require("../models/testModel");
const ticketModel = require("../models/ticketModel");
const transactionModel = require("../models/transactionModel");
const reportModel = require("../models/reportModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2 } = require("../utils/s3");
const { sendEmail } = require("../utils/sendEmail");
const domainModel = require("../models/domainModel");

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
    first_name,
    last_name,
    pay_percent,
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
  if (first_name) subAdmin.first_name = first_name;
  if (last_name) subAdmin.last_name = last_name;
  if (name) subAdmin.name = name;
  if (pay_percent) subAdmin.pay_percent = pay_percent;
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
  const { status, key } = req.query;
  const query = {};
  const [
    totalTickets,
    pendingTicket,
    openTicket,
    closeTicket,
    totalMonthlyTickets,
    monthlyPendingTickets,
    monthlyOpenTickets,
    monthlyCloseTicket,
  ] = await Promise.all([
    ticketModel.countDocuments({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
    ticketModel.countDocuments({
      status: "Pending",
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
    ticketModel.countDocuments({
      status: "Open",
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
    ticketModel.countDocuments({
      status: "Closed",
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),

    ticketModel.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    ticketModel.countDocuments({
      status: "Pending",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    ticketModel.countDocuments({
      status: "Open",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    ticketModel.countDocuments({
      status: "Closed",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
  ]);
  if (status) query.status = status;

  if (key) {
    query.$or = [
      { subject: { $regex: new RegExp(key, "i") } },
      { description: { $regex: new RegExp(key, "i") } },
    ];
  }
  const tickets = await ticketModel
    .find(query)
    .populate("to")
    .populate("from")
    .populate("subdomain")
    .lean();
  res.status(200).json({
    success: true,
    tickets,
    totalTickets,
    pendingTicket,
    openTicket,
    closeTicket,
    totalMonthlyTickets,
    monthlyPendingTickets,
    monthlyOpenTickets,
    monthlyCloseTicket,
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

exports.acceptRequest = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);

  ticket.status = "Open";
  await ticket.save();

  res.status(200).json({
    success: true,
    message: "Ticket Accepted Successfully",
  });
});

exports.closedTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);

  ticket.status = "Closed";
  await ticket.save();

  res.status(200).json({
    success: true,
    message: "Ticket Closed Successfully",
  });
});

exports.deleteTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findByIdAndDelete(req.params.id);
  if (!ticket) return next(new ErrorHandler("Ticket not found", 400));

  res.status(200).json({
    success: true,
    message: "Ticket Deleted Successfully",
  });
});

exports.getStatics = catchAsyncError(async (req, res, next) => {
  const [
    totalNumberOfQuestions,
    totalNumberOfExams,
    totalNumberOfUsers,
    totalNumberOfTestCompleted,
  ] = await Promise.all([
    questionsModel.countDocuments(),
    testModel.countDocuments(),
    userModel.countDocuments(),
    reportModel.countDocuments(),
  ]);

  const transactions = await transactionModel.find().populate("subdomain");
  let totalamountReceived = 0;
  let obj = {};
  for (let transaction of transactions) {
    totalamountReceived += transaction.amount;
    if (obj[transaction.subdomain.sub_domain_name]) {
      obj[transaction.subdomain.sub_domain_name] += transaction.amount;
    } else obj[transaction.subdomain.sub_domain_name] = transaction.amount;
  }

  res.status(200).send({
    totalNumberOfQuestions,
    totalNumberOfExams,
    totalNumberOfUsers,
    totalNumberOfTestCompleted,
    totalamountReceived,
    areaWiseAmountReceived: obj,
    message: "Data fetched Successfully",
  });
});

exports.getUsers = catchAsyncError(async (req, res, next) => {
  const pipeline = [];
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
  if (req.query.key) {
    pipeline.push({
      $match: {
        $or: [
          { first_name: { $regex: req.query.key, $options: "i" } },
          { last_name: { $regex: req.query.key, $options: "i" } },
          { email: { $regex: req.query.key, $options: "i" } },
        ],
      },
    });
  }
  pipeline.push(
    {
      $lookup: {
        from: "transactions",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", "$$userId"] },
                  { $eq: ["$status", "Active"] },
                ],
              },
            },
          },
        ],
        as: "active_transactions",
      },
    },
    {
      $lookup: {
        from: "domains",
        localField: "domain",
        foreignField: "_id",
        as: "domain",
      },
    },
    {
      $lookup: {
        from: "subdomains",
        localField: "subdomain",
        foreignField: "_id",
        as: "subdomain",
      },
    },
    {
      $unwind: {
        path: "$subdomain",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "subadmins",
        let: { subdomainId: "$subdomain._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$subdomainId", "$sub_domain"],
              },
            },
          },
          {
            $project: {
              first_name: 1,
              last_name: 1,
              email: 1,
              profile_url: 1,
            },
          },
        ],
        as: "professors",
      },
    },
    {
      $unwind: {
        path: "$domain",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        first_name: 1,
        last_name: 1,
        email: 1,
        profile_url: 1,
        dob: 1,
        mobile: 1,
        is_verified: 1,
        is_active_plan: 1,
        active_transactions: 1,
        domain: 1,
        subdomain: 1,
        professors: 1,
      },
    }
  );

  const users = await userModel.aggregate(pipeline);
  const currentMonthUserCount = await userModel.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });

  res.status(200).json({
    success: true,
    users,
    userCount: users.length,
    currentMonthUserCount,
    message: "User Fetched Successfully",
  });
});

exports.getPayments = catchAsyncError(async (req, res, next) => {
  const { key } = req.query;
  let transactions = await transactionModel
    .find()
    .populate("user")
    .populate({
      path: "subdomain",
      populate: {
        path: "domain_reference",
      },
    })
    .lean();

  if (key) {
    transactions = transactions.filter(
      (transaction) =>
        transaction.user.first_name.toLowerCase().includes(key.toLowerCase()) ||
        transaction.user.last_name.toLowerCase().includes(key.toLowerCase())
    );
  }

  res.status(200).json({
    payments: transactions,
    paymentCount: transactions.length,
    success: true,
    message: "Payments Fetched Successfully",
  });
});

exports.getUsersGraphData = catchAsyncError(async (req, res, next) => {
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
  const users = await userModel.find({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
    },
  });
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

exports.getAllPayments = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
  const query = {};
  if (subdomain) {
    query["subdomain.sub_domain_name"] = { $regex: new RegExp(subdomain, "i") };
  }
  const transactions = await transactionModel.aggregate([
    {
      $match: {},
    },
    {
      $lookup: {
        from: "subadmins",
        localField: "subdomain",
        foreignField: "sub_domain",
        as: "Professor",
      },
    },
    {
      $lookup: {
        from: "subdomains",
        localField: "subdomain",
        foreignField: "_id",
        as: "subdomain",
      },
    },
    {
      $addFields: {
        Professor: {
          $arrayElemAt: ["$Professor", 0],
        },
      },
      $addFields: {
        subdomain: {
          $arrayElemAt: ["$subdomain", 0],
        },
      },
    },
    {
      $project: {
        "Professor.name": 1,
        "Professor.email": 1,
        amount: 1,
        "subdomain.sub_domain_name": 1,
      },
    },
    {
      $match: query,
    },
  ]);

  res.status(200).json({
    success: true,
    transactions,
    message: "Users data fetch Successfully",
  });
});

exports.getAdminDashboardData = catchAsyncError(async (req, res, next) => {
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
  const [
    currentMonthDomain,
    currentYearDomain,
    currentMonthProfessor,
    currentYearProfessor,
    currentMonthSubscription,
    currentYearSubscription,
  ] = await Promise.all([
    domainModel.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    domainModel.countDocuments({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
    subAdminModel.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    subAdminModel.countDocuments({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
    transactionModel.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }),
    transactionModel.countDocuments({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    }),
  ]);
  const [tickets, domains, subadmins, subscriptions] = await Promise.all([
    ticketModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("from", "first_name last_name profile_url")
      .lean(),
    domainModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    subAdminModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    transactionModel
      .find()
      .sort({ createdAt: -1 })
      .populate("user", "first_name last_name profile_url")
      .populate("subdomain", "sub_domain_name")
      .lean(),
  ]);

  let currentMonthAmount = 0,
    currentYearAmount = 0;
  subscriptions.forEach((subscription) => {
    if (
      subscription.createdAt >= startOfYear &&
      subscription.createdAt <= endOfYear
    )
      currentYearAmount += subscription.amount;
    if (
      subscription.createdAt >= startOfMonth &&
      subscription.createdAt <= endOfMonth
    )
      currentMonthAmount += subscription.amount;
  });
  res.status(200).json({
    success: true,
    cardsData: {
      currentMonthDomain,
      currentYearDomain,
      currentMonthProfessor,
      currentYearProfessor,
      currentMonthSubscription,
      currentYearSubscription,
      currentMonthAmount,
      currentYearAmount,
    },
    data: {
      tickets,
      domains,
      professors: subadmins,
      subscriptions: subscriptions.slice(0, 5),
    },
    message: "Admin Dashboard data fetch Successfully",
  });
});

exports.blockProfessor = catchAsyncError(async (req, res, next) => {
  const subadmin = await subAdminModel.findById(req.params.id);
  subadmin.is_blocked = true;
  await subadmin.save();
  res.status(200).json({
    success: true,
    message: "Professor Account Blocked Successfully",
  });
});

exports.unBlockProfessor = catchAsyncError(async (req, res, next) => {
  const subadmin = await subAdminModel.findById(req.params.id);
  subadmin.is_blocked = false;
  await subadmin.save();
  res.status(200).json({
    success: true,
    message: "Professor Account Unblocked Successfully",
  });
});

exports.deleteProfessor = catchAsyncError(async (req, res, next) => {
  const subadmin = await subAdminModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Professor Deleted Successfully",
  });
});

exports.getPaymentGraph = catchAsyncError(async (req, res, next) => {
  const transactions = await transactionModel.find({
    subdomain: req.query.subdomain,
  });
  const data = {};
  data["Monthly"] = 0;
  data["Quarterly"] = 0;
  data["Annually"] = 0;

  transactions.forEach((transaction) => {
    data[transaction.plan_type] += 1;
  });
  res.status(200).json({
    success: true,
    message: "Graph data Fetched Successfully",
    data,
  });
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const user = await userModel.findByIdAndDelete(id);
  if (!user) return next(new ErrorHandler("User not found", 400));
  res.status(200).send({ success: true, message: "User Deleted" });
});
