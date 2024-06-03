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

exports.getAllTransaction = catchAsyncError(async (req, res, next) => {
  const { subdomain } = req.query;
  const query = {};
  if (subdomain) {
    query.subdomain = subdomain;
  }
  const transactions = await transactionModel
    .find(query)
    .populate("user")
    .lean();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setHours(0, 0, 0, 0);

  // Query the transactions created within the current month
  const newly_transaction = await transactionModel.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  });

  res.status(200).json({
    success: true,
    transactions,
    newly_transaction,
    transaction_count: transactions.length,
    message: "Transactions Found Successfully",
  });
});
