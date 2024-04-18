const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const questionModel = require("../models/questionsModel");
const { s3UploadMulti } = require("../utils/s3");

exports.createQuestion = catchAsyncError(async (req, res, next) => {
  const {
    sub_topic_reference,
    difficulty_level,
    explanation,
    status,
    options,
    correct_option,
    images_count,
  } = req.body;
  if (
    !sub_topic_reference ||
    !difficulty_level ||
    !explanation ||
    !correct_option ||
    !options ||
    !images_count
  ) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  let images = [];
  if (req.files) {
    const results = await s3UploadMulti(req.files);
    images = results
      .slice(0, images_count)
      .map((result) => result.Location.split(".com")[1]);
    explanation.images = results
      .slice(images_count)
      .map((result) => result.Location.split(".com")[1]);
  }
  const question = await questionModel.create({
    sub_topic_reference,
    difficulty_level,
    explanation,
    images: images,
    status,
    options,
    correct_option,
    images_count,
  });

  res.status(201).json({
    success: true,
    question,
    message: "Question Created Successfully",
  });
});

exports.getQuestions = catchAsyncError(async (req, res, next) => {
  const sub_topic_reference = req.query.sub_topic_reference;
  const query = {};
  if (sub_topic_reference) {
    query.sub_topic_reference = sub_topic_reference;
  }
  const questions = await questionModel
    .find(query)
    .populate("sub_topic_reference")
    .lean();
  res.status(200).json({
    success: true,
    questions,
    message: "Questions fetch Successfully",
  });
});

exports.deleteQuestion = catchAsyncError(async (req, res, next) => {
  const question = await questionModel.findByIdAndDelete(req.params.id);
  if (!question) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    message: "Question Deleted Successfully",
  });
});

exports.getQuestion = catchAsyncError(async (req, res, next) => {
  const question = await questionModel
    .findById(req.params.id)
    .populate("sub_topic_reference");
  if (!question) return next(new ErrorHandler("Question not found", 404));

  res.status(200).json({
    success: true,
    question,
    message: "Question find Successfully",
  });
});

exports.updateQuestion = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Question updated Successfully",
  });
});
