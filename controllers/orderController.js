const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { stripeFunction } = require("../utils/stripe");

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const { price, validity, subdomain, planId, userId } = req.body;
  const user = await userModel.findById(userId);
  if (user.is_active_plan) {
    return next(new ErrorHandler("You already have an active plan", 400));
  }
  if (!price || !validity) {
    return next(new ErrorHandler("Price and validity is required", 400));
  }
  const session = await stripeFunction(
    price,
    validity,
    userId,
    planId,
    subdomain
  );
  console.log("session", session);
  res.json({ url: session.url });
});
