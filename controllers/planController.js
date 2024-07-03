const planModel = require("../models/planModel");
const subDomainModel = require("../models/subDomainModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, features, subdomain } = req.body;
  if (!price || !validity) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const plan = await planModel.create({
    price,
    validity,
    features,
  });

  await plan.save();

  if (subdomain) {
    const subdomains = await subDomainModel.findById(subdomain);
    subdomains.plans = subdomains.plans.push(plan._id);
    await subdomains.save();
  }

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

exports.deletePlan = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const plan = await planModel.findByIdAndDelete(id);
  if (!plan) return next(new ErrorHandler("plan not found", 400));
  res.status(200).json({
    success: true,
    message: "Plan deleted Successfully",
  });
});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { validity, price, features } = req.body;
  const plan = await planModel.findById(id);
  if (!plan) return next(new ErrorHandler("plan not found", 400));
  if (validity) plan.validity = validity;
  if (price) plan.price = price;
  if (features) plan.features = features;

  await plan.save();

  res.status(200).json({
    success: true,
    message: "Plan updated Successfully",
  });
});
