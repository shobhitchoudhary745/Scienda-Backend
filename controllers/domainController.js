const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const domainModel = require("../models/domainModel");
const subDomainModel = require("../models/subDomainModel");
const topicModel = require("../models/topicModel");
const subTopicModel = require("../models/subTopicModel");
const questionsModel = require("../models/questionsModel");

exports.createDomain = catchAsyncError(async (req, res, next) => {
  const { domain_name, description } = req.body;
  if (!domain_name || !description) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const existingDomain = await domainModel.findOne({ domain_name });
  if (existingDomain) {
    return next(new ErrorHandler("Domain name Already Exist", 400));
  }
  const domain = await domainModel.create({
    domain_name,
    description,
  });

  res.status(201).json({
    success: true,
    domain,
    message: "Domain Created Successfully",
  });
});

exports.getDomains = catchAsyncError(async (req, res, next) => {
  const { key, resultPerPage, currentPage } = req.query;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) query.domain_name = { $regex: new RegExp(key, "i") };

  const findQuery = domainModel.find(query).skip(skip);
  if (limit) {
    findQuery.limit(limit);
  }

  const domains = await findQuery.lean();

  res.status(200).json({
    success: true,
    domains,
    message: "Domains fetched successfully",
  });
});

exports.deleteDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findByIdAndDelete(req.params.id);
  if (!domain) return next(new ErrorHandler("domain not found", 404));

  res.status(200).json({
    success: true,
    message: "Domain Deleted Successfully",
  });
});

exports.getDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findById(req.params.id);
  if (!domain) return next(new ErrorHandler("domain not found", 404));

  res.status(200).json({
    success: true,
    domain,
    message: "Domain find Successfully",
  });
});

exports.updateDomain = catchAsyncError(async (req, res, next) => {
  const domain = await domainModel.findById(req.params.id);
  if (!domain) return next(new ErrorHandler("Domain not found", 404));
  const { domain_name, description } = req.body;
  if (domain_name && domain.domain_name != domain_name) {
    const domain = await domainModel.findOne({ domain_name });
    if (domain) return next(new ErrorHandler("Domain Already Exist", 400));
  }
  if (domain_name) domain.domain_name = domain_name;
  if (description) domain.description = description;
  await domain.save();
  res.status(200).json({
    success: true,
    message: "Domain updated successfully",
  });
});

exports.viewSummary = catchAsyncError(async (req, res, next) => {
  const domains = await domainModel.find().lean();
  const summary1 = {};
  for (let domain of domains) {
    summary1[domain.domain_name] = [];
    const subdomains = await subDomainModel
      .find({
        domain_reference: domain._id,
      })
      .populate("domain_reference");
    for (let subDomain of subdomains) {
      const summary = {};
      // summary.domain = subDomain.domain_reference.domain_name;
      summary.subdomain = subDomain.sub_domain_name;
      summary.topics = {};

      const topics = await topicModel
        .find({ sub_domain_reference: subDomain._id })
        .lean();
      for (let topic of topics) {
        summary.topics[topic.topic_name] = {};
        summary.topics[topic.topic_name].questionsCount = 0;
        summary.topics[topic.topic_name].topic_reference = topic._id;

        summary.topics[topic.topic_name].subtopics = await subTopicModel
          .find({
            topic_reference: topic._id,
          })
          .lean();

        for (let subtopic of summary.topics[topic.topic_name].subtopics) {
          const questionsCount = await questionsModel.countDocuments({
            sub_topic_reference: subtopic._id,
          });

          subtopic.questionsCount = questionsCount;
          summary.topics[topic.topic_name].questionsCount += questionsCount;
        }
      }
      summary1[domain.domain_name].push(summary);
    }
  }
  res.status(200).send({
    message: "Summary data fetched Successfully",
    summary: summary1,
  });
});
