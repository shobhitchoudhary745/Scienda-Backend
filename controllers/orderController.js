const orderModel = require("../models/orderModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { stripeFunction } = require("../utils/stripe");

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const { price, validity, subdomain, planId } = req.body;
  if (!price || !validity) {
    return next(new ErrorHandler("Price and validity is required", 400));
  }
  const session = await stripeFunction(
    price,
    validity,
    req.userId,
    subdomain,
    planId
  );
  console.log("session", session);
  res.json({ url: session.url });
});
