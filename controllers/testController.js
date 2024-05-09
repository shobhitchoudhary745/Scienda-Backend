const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const testModel = require("../models/testModel");


exports.createTest = catchAsyncError(async (req, res, next) => {
  const {
    test_name,
    questions_reference,
    duration_in_mins,
    test_type,
    subdomain_reference,
    number_of_questions,
  } = req.body;
  if (
    !test_name ||
    !questions_reference ||
    !duration_in_mins ||
    !test_type ||
    !subdomain_reference ||
    !number_of_questions
  ) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const test = await testModel.create({
    test_name,
    number_of_questions,
    questions_reference,
    duration_in_mins,
    test_creator: req.userId,
    test_type,
    subdomain_reference,
  });

  res.status(201).json({
    success: true,
    test,
    message: "Test Created Successfully",
  });
});

exports.getTests = catchAsyncError(async (req, res, next) => {
  const { subdomain_reference } = req.query;
  const query = {};
  if (subdomain_reference) {
    query.subdomain_reference = subdomain_reference;
  }
  const tests = await testModel
    .find(query)
    .populate({
      path: "questions_reference",
      populate: {
        path: "sub_topic_reference",
        populate: {
          path: "topic_reference",
        },
      },
    })
    .populate("subdomain_reference")
    .lean();
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
    .populate({
      path: "questions_reference",
      populate: {
        path: "sub_topic_reference",
        populate: {
          path: "topic_reference",
        },
      },
    })
    .populate("subdomain_reference");
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
