const salaryModel = require("../models/salaryModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getSalaries = catchAsyncError(async (req, res, next) => {
  const { from, to } = req.query;

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

  salarys.forEach((salary) => {
    arr = [...arr, ...salary.area_wise];
  });

  res.status(200).send({
    salarys,
    areawise: arr,
    message: "Salary Fetched Successfully",
  });
});
