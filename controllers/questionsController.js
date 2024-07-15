const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const questionModel = require("../models/questionsModel");
const { s3UploadMulti } = require("../utils/s3");
const testModel = require("../models/testModel");

exports.createQuestion = catchAsyncError(async (req, res, next) => {
  const {
    question,
    sub_topic_reference,
    difficulty_level,
    explanation,
    status,
    options,
    correct_option,
    images_count,
    question_type,
  } = req.body;

  let options_array = [];

  if (question_type === "True/False") {
    options_array.push("True");
    options_array.push("False");
  }
  if (
    status != "Pending" &&
    (!question ||
      !sub_topic_reference ||
      !difficulty_level ||
      !explanation ||
      !correct_option ||
      !images_count ||
      !question_type)
  ) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  let images = [];
  if (req.files) {
    const results = await s3UploadMulti(req.files);
    images = results
      .slice(0, Number(images_count))
      .map((result) => result.Location.split(".com")[1]);
    explanation.images = results
      .slice(Number(images_count))
      .map((result) => result.Location.split(".com")[1]);
  }
  const questions = await questionModel.create({
    question,
    sub_topic_reference,
    difficulty_level,
    explanation,
    images: images,
    status,
    options: question_type === "True/False" ? options_array : options,
    correct_option,
    images_count,
    question_type,
  });

  res.status(201).json({
    success: true,
    questions,
    message:
      status == "Pending"
        ? "Question Saved as draft"
        : "Question Created Successfully",
  });
});

exports.getQuestions = catchAsyncError(async (req, res, next) => {
  const { key, resultPerPage, currentPage, status } = req.query;
  const sub_topic_reference = req.query.sub_topic_reference;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) {
    query.question = { $regex: new RegExp(key, "i") };
  }

  if (status) {
    query.status = status;
  }

  if (sub_topic_reference) {
    query.sub_topic_reference = sub_topic_reference;
  }

  const findQuery = questionModel
    .find(query)
    .populate({
      path: "sub_topic_reference",
      populate: {
        path: "topic_reference",
      },
    })
    .skip(skip)
    .sort({ createdAt: -1 });

  if (limit) {
    findQuery.limit(limit);
  }
  let questions = await findQuery.lean();
  if (req.query.subdomain) {
    questions = questions.filter(
      (question) =>
        question.sub_topic_reference.topic_reference.sub_domain_reference.toString() ==
        req.query.subdomain
    );
  } else if (req.query.topic) {
    questions = questions.filter(
      (question) =>
        question.sub_topic_reference.topic_reference._id.toString() ==
        req.query.topic
    );
  }

  res.status(200).json({
    success: true,
    questions,
    message: "Questions fetch Successfully",
  });
});

exports.deleteQuestion = catchAsyncError(async (req, res, next) => {
  const test = await testModel.findOne({
    questions_reference: { $in: [req.params.id] },
  });
  if (test) {
    return next(
      new ErrorHandler(
        "You can not delete this question. As it is present in one or more Test",
        400
      )
    );
  }
  const question = await questionModel.findByIdAndDelete(req.params.id);
  if (!question) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    message: "Question Deleted Successfully",
  });
});

exports.getQuestion = catchAsyncError(async (req, res, next) => {
  const question = await questionModel.findById(req.params.id).populate({
    path: "sub_topic_reference",
    populate: {
      path: "topic_reference",
      populate: {
        path: "sub_domain_reference",
        populate: {
          path: "domain_reference",
        },
      },
    },
  });
  if (!question) return next(new ErrorHandler("Question not found", 404));

  res.status(200).json({
    success: true,
    question,
    message: "Question find Successfully",
  });
});

exports.updateQuestion = catchAsyncError(async (req, res, next) => {
  const questions = await questionModel.findById(req.params.id);
  if (!questions) return next(new ErrorHandler("Question Not Found", 400));
  const {
    question,
    sub_topic_reference,
    difficulty_level,
    explanation_description,
    explanation_images,
    explanation_reference,
    status,
    options,
    correct_option,
    images_count,
    images,
    question_type,
  } = req.body;
  let image = [];
  let explanations = {};
  explanations.images = [];
  if (explanation_images)
    explanations.images = explanation_images.filter((image) => image != "");
  if (explanation_reference)
    explanations.references = explanation_reference.filter(
      (reference) => reference != ""
    );
  if (explanation_description)
    explanations.description = explanation_description;
  if (images) image = images.filter((image) => image != "");

  if (req.files) {
    const results = await s3UploadMulti(req.files);
    questions.images = [
      ...image,
      ...results
        .slice(0, Number(images_count))
        .map((result) => result.Location.split(".com")[1]),
    ];
    if (explanation_images) {
      explanations.images = [
        ...explanations.images,
        ...results
          .slice(Number(images_count))
          .map((result) => result.Location.split(".com")[1]),
      ];
    } else {
      explanations.images = results
        .slice(Number(images_count))
        .map((result) => result.Location.split(".com")[1]);
    }
  }
  if (question) questions.question = question;
  if (status) questions.status = status;
  if (sub_topic_reference) questions.sub_topic_reference = sub_topic_reference;
  if (difficulty_level) questions.difficulty_level = difficulty_level;
  if (options) questions.options = options;
  if (correct_option) questions.correct_option = correct_option;
  if (question_type) questions.question_type = question_type;
  // questions.explanation = { ...questions.explanation, ...explanations };
  if (explanation_description)
    questions.explanation.description = explanation_description;
  if (explanation_reference)
    questions.explanation.references = explanations.references;
  if (explanation_images) questions.explanation.images = explanations.images;
  await questions.save();

  res.status(200).json({
    success: true,
    message:
      status == "Pending"
        ? "Question Saved as draft"
        : "Question Created Successfully",
  });
});
