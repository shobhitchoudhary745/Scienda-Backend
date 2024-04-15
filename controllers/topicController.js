const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const topicModel = require("../models/topicModel");

exports.createTopic = catchAsyncError(async (req, res, next) => {
  const { topic_name, sub_domain_reference, description, references, images } =
    req.body;
  if (!topic_name || !sub_domain_reference || !description) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const existingTopic = await topicModel.findOne({
    topic_name,
    sub_domain_reference,
  });
  if (existingTopic) {
    return next(new ErrorHandler("Topic name Already Exist", 400));
  }
  const topic = await topicModel.create({
    sub_domain_reference,
    description,
    topic_name,
    references,
  });

  res.status(201).json({
    success: true,
    topic,
    message: "Topic Created Successfully",
  });
});

exports.getTopics = catchAsyncError(async (req, res, next) => {
  const sub_domain_reference = req.query.sub_domain;
  const query = {};
  if (sub_domain_reference) {
    query.sub_domain_reference = sub_domain_reference;
  }
  const topics = await topicModel.find(query).lean();
  res.status(200).json({
    success: true,
    topics,
    message: "Topics fetch Successfully",
  });
});

exports.deleteTopic = catchAsyncError(async (req, res, next) => {
  const topic = await topicModel.findByIdAndDelete(req.params.id);
  if (!topic) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    message: "Topic Deleted Successfully",
  });
});

exports.getTopic = catchAsyncError(async (req, res, next) => {
  const topic = await topicModel.findById(req.params.id);
  if (!topic) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    topic,
    message: "Topic find Successfully",
  });
});

exports.updateTopic = catchAsyncError(async (req, res, next) => {
  const topic = await topicModel.findById(req.params.id);
  if (!topic) return next(new ErrorHandler("Topic not found", 404));
  const { topic_name, sub_domain_reference, description, references, images } =
    req.body;
  if (topic_name && sub_domain_reference && topic.topic_name != topic_name) {
    const topic = await topicModel.findOne({
      topic_name,
      sub_domain_reference,
    });
    if (topic) return next(new ErrorHandler("Topic Already Exist", 400));
  }
  if (topic_name) topic.topic_name = topic_name;
  if (description) topic.description = description;
  if (sub_domain_reference) topic.sub_domain_reference = sub_domain_reference;
  if (references) topic.references = references;
  await topic.save();
  res.status(200).json({
    success: true,
    message: "Topic updated Successfully",
  });
});
