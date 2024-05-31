const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const transactionModel = require("../models/transactionModel");

exports.getMyTransaction = catchAsyncError(async (req, res, next) => {
    
  const transactions = await transactionModel.find({user:req.userId}).lean();
  let subscription = {};
  if (transactions.length) {
    subscription.amount = transactions[transactions.length-1].amount;
    subscription.validity = transactions[transactions.length-1].validity;
  }
  res.status(200).json({
    success: true,
    transactions,
    subscription,
    message: "Transaction Found Successfully",
  });
});
