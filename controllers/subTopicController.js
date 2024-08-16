const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const subTopicModel = require("../models/subTopicModel");
const { s3UploadMulti } = require("../utils/s3");
const questionModel = require("../models/questionsModel");
const testModel = require("../models/testModel");

exports.createSubTopic = catchAsyncError(async (req, res, next) => {
  const { sub_topic_name, topic_reference, description, references } = req.body;
  if (!sub_topic_name || !topic_reference || !description) {
    return next(new ErrorHandler("All Fields are required", 400));
  }
  const existingSubTopic = await subTopicModel.findOne({
    sub_topic_name,
    topic_reference,
  });
  if (existingSubTopic) {
    return next(new ErrorHandler("SubTopic name Already Exist", 400));
  }

  let images = [];

  if (req.files) {
    const results = await s3UploadMulti(req.files);
    images = results.map((result) => result.Location.split(".com")[1]);
  }
  const subTopic = await subTopicModel.create({
    sub_topic_name,
    description,
    topic_reference,
    references,
    images,
  });

  res.status(201).json({
    success: true,
    subTopic,
    message: "SubTopic Created Successfully",
  });
});

exports.getSubTopics = catchAsyncError(async (req, res, next) => {
  const { key, resultPerPage, currentPage } = req.query;
  const topic_reference = req.query.topic;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) query.sub_topic_name = { $regex: new RegExp(key, "i") };

  if (topic_reference) {
    query.topic_reference = topic_reference;
  }

  const findQuery = subTopicModel.find(query).skip(skip);

  if (limit) {
    findQuery.limit(limit);
  }

  const subTopics = await findQuery
    .lean()
    .sort({ sub_topic_name: 1 })
    .collation({ locale: "en", strength: 2 });
  res.status(200).json({
    success: true,
    subTopics,
    message: "SubTopics fetch Successfully",
  });
});

exports.deleteSubTopic = catchAsyncError(async (req, res, next) => {
  const question = await questionModel.findOne({
    sub_topic_reference: req.params.id,
  });
  if (question) {
    return next(
      new ErrorHandler(
        "You can not delete this subtopic as it contains one or more question",
        400
      )
    );
  }
  const test = await testModel.findOne({
    subtopic_reference: req.params.id,
  });
  if (test) {
    return next(
      new ErrorHandler(
        "You can not delete this subtopic as it contains one or more test",
        400
      )
    );
  }
  const subTopic = await subTopicModel.findByIdAndDelete(req.params.id);
  if (!subTopic) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    message: "SubTopic Deleted Successfully",
  });
});

exports.getSubTopic = catchAsyncError(async (req, res, next) => {
  const subTopic = await subTopicModel
    .findById(req.params.id)
    .populate("topic_reference");
  if (!subTopic) return next(new ErrorHandler("Topic not found", 404));

  res.status(200).json({
    success: true,
    subTopic,
    message: "SubTopic find Successfully",
  });
});

exports.updateSubTopic = catchAsyncError(async (req, res, next) => {
  const subTopic = await subTopicModel.findById(req.params.id);
  if (!subTopic) return next(new ErrorHandler("SubTopic not found", 404));
  const { sub_topic_name, topic_reference, description, references, images } =
    req.body;
  if (
    sub_topic_name &&
    topic_reference &&
    subTopic.sub_topic_name != sub_topic_name
  ) {
    const subTopic = await subTopicModel.findOne({
      sub_topic_name,
      topic_reference,
    });
    if (subTopic) return next(new ErrorHandler("SubTopic Already Exist", 400));
  }
  if (sub_topic_name) subTopic.sub_topic_name = sub_topic_name;
  if (description) subTopic.description = description;
  if (topic_reference) subTopic.topic_reference = topic_reference;
  if (references)
    subTopic.references =
      typeof references === "string" ? [references] : references;
  let image = [];
  if (req.files) {
    const results = await s3UploadMulti(req.files);
    image = results.map((data) => data.Location.split(".com")[1]);
  }
  if (images)
    subTopic.images = [...images.filter((image) => image != ""), ...image];
  else {
    subTopic.images = [...image];
  }
  await subTopic.save();
  res.status(200).json({
    success: true,
    message: "SubTopic updated Successfully",
  });
});
