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
  const { subdomain, key } = req.query;
  const query = {};
  if (subdomain) {
    query.subdomain = subdomain;
  }
  let transactions = await transactionModel
    .find(query)
    .populate({
      path: "user",
      populate: {
        path: "subdomain",
        populate: {
          path: "domain_reference",
        },
      },
    })
    .lean();

  if (key) {
    transactions = transactions.filter(
      (transaction) =>
        transaction.user.first_name.toLowerCase().includes(key.toLowerCase()) ||
        transaction.user.last_name.toLowerCase().includes(key.toLowerCase()) ||
        transaction.user.email.toLowerCase().includes(key.toLowerCase())
    );
  }

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
