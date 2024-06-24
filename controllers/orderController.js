const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { stripeFunction } = require("../utils/stripe");

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const { price, plan_type, subdomain, planId, userId } = req.body;
  const user = await userModel.findById(userId);
  if (user.is_active_plan) {
    return next(new ErrorHandler("You already have an active plan", 400));
  }
  if (!price || !plan_type) {
    return next(new ErrorHandler("Price and Plan type is required", 400));
  }
  let validity = 0;
  if (plan_type == "Monthly") validity = 30;
  if (plan_type == "Quarterly") validity = 120;
  if (plan_type == "Annually") validity = 365;
  const session = await stripeFunction(
    price,
    validity,
    userId,
    planId,
    subdomain,
    plan_type
  );
  
  res.json({ url: session.url });
});
