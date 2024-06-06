const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const pageModel = require("../models/professorSideContentManagementModel");

exports.createPage = catchAsyncError(async (req, res, next) => {
  const { title, description, subdomain_reference } = req.body;

  const page = await pageModel.create({
    title,
    description,
    subdomain_reference,
  });

  res.status(201).json({
    success: true,
    page,
    message: "Page Created Successfully",
  });
});

exports.getPages = catchAsyncError(async (req, res, next) => {
  const query = {};
  const { subdomain } = req.query;
  if (subdomain) {
    query.subdomain_reference = subdomain;
  }
  const pages = await pageModel.find(query).lean();

  res.status(200).json({
    success: true,
    pages,
    message: "pages fetch successfully",
  });
});

exports.deletePage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findByIdAndDelete(req.params.id);
  if (!page) return next(new ErrorHandler("Page not found", 404));

  res.status(200).json({
    success: true,
    message: "Page Deleted successfully",
  });
});

exports.getPage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findById(req.params.id);
  if (!page) return next(new ErrorHandler("Page not found", 404));

  res.status(200).json({
    success: true,
    page,
    message: "Page find successfully",
  });
});

exports.updatePage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findById(req.params.id);
  if (!page) return next(new ErrorHandler("page not found", 404));
  const { title, description, subdomain_reference } = req.body;

  if (title) page.title = title;
  if (description) page.description = description;
  if (subdomain_reference) page.subdomain_reference = subdomain_reference;
  await page.save();
  res.status(200).json({
    success: true,
    message: "Page updated successfully",
  });
});
