const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const topicModel = require("../models/topicModel");
const { s3UploadMulti } = require("../utils/s3");

exports.createTopic = catchAsyncError(async (req, res, next) => {
  const { topic_name, sub_domain_reference, description, references } =
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

  let images = [];

  if (req.files) {
    const results = await s3UploadMulti(req.files);
    images = results.map((result) => result.Location.split(".com")[1]);
  }

  const topic = await topicModel.create({
    sub_domain_reference,
    description,
    topic_name,
    references,
    images,
  });

  res.status(201).json({
    success: true,
    topic,
    message: "Topic Created Successfully",
  });
});

exports.getTopics = catchAsyncError(async (req, res, next) => {
  const { key, resultPerPage, currentPage } = req.query;
  const sub_domain_reference = req.query.sub_domain;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) query.topic_name = { $regex: new RegExp(key, "i") };

  if (sub_domain_reference) {
    query.sub_domain_reference = sub_domain_reference;
  }

  const findQuery = topicModel.find(query).skip(skip);
  if (limit) {
    findQuery.limit(limit);
  }

  const topics = await findQuery
    .sort({ topic_name: 1 })
    .collation({ locale: "en", strength: 2 })
    .lean();

  res.status(200).json({
    success: true,
    topics,
    message: "Topics fetch Successfully",
  });
});

exports.deleteTopic = catchAsyncError(async (req, res, next) => {
  // const topic = await topicModel.findByIdAndDelete(req.params.id);
  // if (!topic) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    message: "Topic Deleted Successfully",
  });
});

exports.getTopic = catchAsyncError(async (req, res, next) => {
  const topic = await topicModel
    .findById(req.params.id)
    .populate("sub_domain_reference");
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
  if (references)
    topic.references =
      typeof references === "string" ? [references] : references;
  let image = [];
  if (req.files) {
    const results = await s3UploadMulti(req.files);
    image = results.map((data) => data.Location.split(".com")[1]);
  }
  if (images)
    topic.images = [...images.filter((image) => image != ""), ...image];
  else topic.images = [...image];
  await topic.save();
  res.status(200).json({
    success: true,
    message: "Topic updated Successfully",
  });
});
