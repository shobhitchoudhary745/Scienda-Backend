const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { addBankDetails } = require("../utils/stripe");

exports.addBank = catchAsyncError(async (req, res, next) => {
  const { id } = req.body;
  const subadmin = await subAdminModel.findById(id);
  const data = await addBankDetails("GB");
  subadmin.account_id = data.accountId;

  res.status(200).json({
    success: true,
    data,
    message: "Link generated",
  });
});

exports.getPlans = catchAsyncError(async (req, res, next) => {
  const plans = await planModel.find();
  res.status(200).json({
    success: true,
    plans,
    message: "Plan Fetched Successfully",
  });
});
