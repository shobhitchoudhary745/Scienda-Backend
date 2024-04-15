const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const subDomainModel = require("../models/subDomainModel");
const planModel = require("../models/planModel");

exports.createSubDomain = catchAsyncError(async (req, res, next) => {
  const { sub_domain_name, domain_url, domain_reference, plans } = req.body;
  if (!sub_domain_name || !domain_url || !domain_reference) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const existingSubDomain = await subDomainModel.findOne({
    sub_domain_name,
    domain_reference,
  });
  if (existingSubDomain) {
    return next(new ErrorHandler("Sub Domain name Already Exist", 400));
  }
  const results = await planModel.insertMany(plans);
  const subDomain = await subDomainModel.create({
    sub_domain_name,
    domain_url,
    domain_reference,
    plans:results.map(data=>data._id)
  });

  res.status(201).json({
    success: true,
    subDomain,
    message: "Sub Domain Created Successfully",
  });
});

exports.getSubDomains = catchAsyncError(async (req, res, next) => {
  const domain_reference = req.query.domain;
  const query = {};
  if (domain_reference) {
    query.domain_reference = domain_reference;
  }
  const subDomains = await subDomainModel.find(query).lean();
  res.status(200).json({
    success: true,
    subDomains,
    message: "Subdomains fetch Successfully",
  });
});

exports.deleteSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel.findByIdAndDelete(req.params.id);
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));

  res.status(200).json({
    success: true,
    message: "Subdomain Deleted Successfully",
  });
});

exports.getSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel.findById(req.params.id);
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));

  res.status(200).json({
    success: true,
    subDomain,
    message: "SubDomain find Successfully",
  });
});

exports.updateSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel.findById(req.params.id);
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));
  const { sub_domain_name, domain_url, domain_reference } = req.body;
  if (sub_domain_name && domain_reference) {
    const subDomain = await subDomainModel.findOne({
      sub_domain_name,
      domain_reference,
    });
    if (subDomain)
      return next(new ErrorHandler("Subdomain Already Exist", 400));
  }
  if (sub_domain_name) subDomain.sub_domain_name = sub_domain_name;
  if (domain_url) subDomain.domain_url = domain_url;
  await subDomain.save();
  res.status(200).json({
    success: true,
    message: "Subdomain updated successfully",
  });
});
