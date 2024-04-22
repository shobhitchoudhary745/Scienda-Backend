const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const testModel = require("../models/testModel");

exports.createTest = catchAsyncError(async (req, res, next) => {
  const {
    test_name,
    number_of_questions,
    questions_reference,
    duration_in_mins,
    start_date,
    test_creator,
  } = req.body;
  if (
    !test_name ||
    !questions_reference ||
    !duration_in_mins ||
    !start_date ||
    !test_creator
  ) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const test = await testModel.create({
    test_name,
    number_of_questions,
    questions_reference,
    duration_in_mins,
    start_date,
    test_creator,
  });

  res.status(201).json({
    success: true,
    test,
    message: "Test Created Successfully",
  });
});

exports.getTests = catchAsyncError(async (req, res, next) => {
  const tests = await testModel.find().populate("questions_reference").lean();
  res.status(200).json({
    success: true,
    tests,
    message: "Tests fetch Successfully",
  });
});

exports.deleteTest = catchAsyncError(async (req, res, next) => {
  const test = await testModel.findByIdAndDelete(req.params.id);
  if (!test) return next(new ErrorHandler("Test not found", 404));

  res.status(200).json({
    success: true,
    message: "Test Deleted Successfully",
  });
});

exports.getTest = catchAsyncError(async (req, res, next) => {
  const test = await testModel
    .findById(req.params.id)
    .populate("questions_reference");
  if (!test) return next(new ErrorHandler("Test not found", 404));

  res.status(200).json({
    success: true,
    test,
    message: "Test find Successfully",
  });
});

exports.updateTest = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Test updated Successfully",
  });
});
