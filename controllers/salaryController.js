const salaryModel = require("../models/salaryModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getSalaries = catchAsyncError(async (req, res, next) => {
  const salarys = await salaryModel
    .find({ professor: req.userId })
    .populate({ path: "area_wise.subdomain",select:["sub_domain_name"] })
    .lean();

  res.status(200).send({
    salarys,
    message: "Salary Fetched Successfully",
  });
});
