const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const domainModel = require("../models/domainModel");

exports.createDomain = catchAsyncError(async (req, res, next) => {
  const { domain_name, description } = req.body;
  if (!domain_name || !description) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const existingDomain = await domainModel.findOne({ domain_name });
  if (existingDomain) {
    return next(new ErrorHandler("Domain name Already Exist", 400));
  }
  const domain = await domainModel.create({
    domain_name,
    description,
  });

  res.status(201).json({
    success: true,
    domain,
    message: "Domain Created Successfully",
  });
});

exports.getDomains = catchAsyncError(async (req, res, next) => {
  const domains = await domainModel.find().lean();
  res.status(200).json({
    success: true,
    domains,
    message: "Domains fetch Successfully",
  });
});

exports.deleteDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findByIdAndDelete(req.params.id);
  if (!domain) return next(new ErrorHandler("domain not found", 404));

  res.status(200).json({
    success: true,
    message: "Domain Deleted Successfully",
  });
});

exports.getDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findById(req.params.id);
  if (!domain) return next(new ErrorHandler("domain not found", 404));

  res.status(200).json({
    success: true,
    domain,
    message: "Domain find Successfully",
  });
});

exports.updateDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findById(req.params.id);
  if (!domain) return next(new ErrorHandler("Domain not found", 404));
  const { domain_name, description } = req.body;
  if (domain_name) {
    const domain = await domainModel.findOne({ domain_name });
    if (domain) return next(new ErrorHandler("Domain Already Exist", 400));
  }
  if (domain_name) domain.domain_name = domain_name;
  if (description) domain.description = description;
  await domain.save();
  res.status(200).json({
    success: true,
    message: "Domain updated successfully",
  });
});
