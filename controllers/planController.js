const planModel = require("../models/planModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, validity } = req.body;
  if (!price || !validity) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const plan = await planModel.create({ price, validity });

  await plan.save();

  res.status(200).json({
    success: true,
    plan,
    message: "Plan Created Successfully",
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
