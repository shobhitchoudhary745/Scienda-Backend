const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const transactionModel = require("../models/transactionModel");

exports.getMyTransaction = catchAsyncError(async (req, res, next) => {
  const transactions = await transactionModel.find({ user: req.userId }).lean();
  let subscription = {};
  if (transactions.length) {
    if (new Date(transactions[transactions.length - 1].expiry) > new Date())
      subscription.amount = transactions[transactions.length - 1].amount;
    subscription.expiry = transactions[transactions.length - 1].expiry;
  }
  res.status(200).json({
    success: true,
    transactions,
    subscription,
    message: "Transaction Found Successfully",
  });
});
