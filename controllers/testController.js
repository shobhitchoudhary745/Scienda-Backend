const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const testModel = require("../models/testModel");
const reportModel = require("../models/reportModel");

exports.createTest = catchAsyncError(async (req, res, next) => {
  const {
    test_name,
    questions_reference,
    duration_in_mins,
    test_type,
    subdomain_reference,
    number_of_questions,
    topic_reference,
    status,
  } = req.body;
  if (
    status != "Pending" &&
    (!test_name ||
      !questions_reference ||
      !duration_in_mins ||
      !test_type ||
      !subdomain_reference ||
      !number_of_questions ||
      !topic_reference)
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
    topic_reference,
  });

  res.status(201).json({
    success: true,
    test,
    message:
      status == "Pending" ? "Test Saved as draft" : "Test Created Successfully",
  });
});

exports.getTests = catchAsyncError(async (req, res, next) => {
  const { subdomain_reference, key } = req.query;
  const query = {};
  if (subdomain_reference) {
    query.subdomain_reference = subdomain_reference;
  }
  if (key) {
    if (key) query.test_name = { $regex: new RegExp(key, "i") };
  }
  const tests = await testModel
    .find(query)
    .populate({
      path: "questions_reference",
      select: "-correct_option",
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
      select: "-correct_option",
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
  const {
    test_name,
    questions_reference,
    duration_in_mins,
    test_type,
    subdomain_reference,
    number_of_questions,
    status,
    topic_reference,
  } = req.body;
  const test = await testModel.findById(req.params.id);
  if (test_name) test.test_name = test_name;
  if (questions_reference) test.questions_reference = questions_reference;
  if (duration_in_mins) test.duration_in_mins = duration_in_mins;
  if (test_type) test.test_type = test_type;
  if (subdomain_reference) test.subdomain_reference = subdomain_reference;
  if (number_of_questions) test.number_of_questions = number_of_questions;
  if (status) test.status = status;
  if (topic_reference) test.topic_reference = topic_reference;

  await test.save();
  res.status(200).json({
    success: true,
    message:
      status == "Pending" ? "Test Saved as draft" : "Test Created Successfully",
  });
});

exports.submitTest = catchAsyncError(async (req, res, next) => {
  const { response } = req.body;
  let attempt = 0,
    unattempt = 0,
    correct_answers = 0,
    wrong_answers = 0;
  const test = await testModel
    .findById(req.params.id)
    .populate("questions_reference")
    .populate("subdomain_reference");

  if (!test) return next(new ErrorHandler("Test not found", 404));
  for (let question in test.questions_reference) {
    if (!response[question].selected) {
      unattempt += 1;
      response[question].status = "Unattempt";
    } else if (
      response[question].selected ==
      test.questions_reference[question].correct_option
    ) {
      attempt += 1;
      correct_answers += 1;
      response[question].status = "Correct";
    } else {
      attempt += 1;
      wrong_answers += 1;
      response[question].status = "Wrong";
    }
  }

  const report = await reportModel.create({
    user: req.userId,
    test: test._id,
    attempt,
    unattempt,
    wrong_answers,
    correct_answers,
    answers: response,
  });

  res.status(200).json({
    success: true,
    message: "Test Submitted Successfully",
  });
});
