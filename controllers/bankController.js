const { getLogger } = require("nodemailer/lib/shared");
const subAdminModel = require("../models/subAdminModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { addBankDetails, generateLoginLink } = require("../utils/stripe");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.addBank = catchAsyncError(async (req, res, next) => {
  const { id } = req.body;
  const subadmin = await subAdminModel.findById(id);
  console.log(subadmin)

  if (subadmin.account_id) {
    const confirmAccount = await stripe.accounts.retrieve(
      subadmin.account_id
    );
    if (confirmAccount.capabilities.transfers == "active") {
      const loginlink = await generateLoginLink(subadmin.account_id);
      return res.status(200).send({
        loginlink,
      });
    }
  }

  const data = await addBankDetails("US");
  await subAdminModel.findByIdAndUpdate(
    { _id: id },
    {
      account_id: data.accountId,
    }
  );

  res.status(200).json({
    success: true,
    data,
    message: "Link generated",
  });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { id } = req.body;
  const subadmin = await subAdminModel.findById(id);

  const data = await generateLoginLink(subadmin.account_id);

  res.status(200).json({
    success: true,
    data,
    message: "Link generated",
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
