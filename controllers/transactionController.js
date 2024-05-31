const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const transactionModel = require("../models/testModel");

exports.getMyTransaction = catchAsyncError(async (req, res, next) => {
  const transaction = await transactionModel.find({}).lean();
  let subscription = {};
  if (transaction.length && transaction[transaction.length - 1]) {
    subscription.amount = transaction.amount;
    subscription.validity = transaction.validity;
    transaction.subscription = subscription;
  }
  res.status(201).json({
    success: true,
    transaction,
    message: "Test Created Successfully",
  });
});
