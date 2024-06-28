const salaryModel = require("../models/salaryModel");
const subAdminModel = require("../models/subAdminModel");
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getSalaries = catchAsyncError(async (req, res, next) => {
  const { from, to } = req.query;
  const subadmin = await subAdminModel.findById(req.userId);
  const users = await userModel.find({
    subdomain: { $in: subadmin.sub_domain },
  });

  const obj = {};
  if (from) {
    const [day, month, year] = from.split("-").map(Number);
    const fromdate = new Date(year, month - 1, day + 1);
    obj.createdAt = {
      $gte: fromdate,
    };
  }
  if (to) {
    const [day, month, year] = to.split("-").map(Number);
    const todate = new Date(year, month - 1, day + 1);
    obj.createdAt = {
      $lte: todate,
    };
  }

  if (from && to) {
    const [day, month, year] = from.split("-").map(Number);

    const [day1, month1, year1] = to.split("-").map(Number);
    const fromdate = new Date(year, month - 1, day + 1);
    const todate = new Date(year1, month1 - 1, day1 + 1);

    obj.createdAt = {
      $gte: fromdate,
      $lte: todate,
    };
  }
  const salarys = await salaryModel
    .find({ professor: req.userId, ...obj })
    .populate({ path: "area_wise.subdomain", select: ["sub_domain_name"] })
    .lean();

  let arr = [];
  let totalSalary = 0;
  let lastPayment = 0;

  salarys.forEach((salary) => {
    arr = [...arr, ...salary.area_wise];
    totalSalary += salary.amount;
  });

  if (salarys.length) {
    lastPayment = salarys[salarys.length - 1].amount;
  }

  res.status(200).send({
    salarys,
    userCount: users.length,
    areawise: arr,
    lastPayment,
    totalSalary,
    message: "Salary Fetched Successfully",
  });
});
