const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const subDomainModel = require("../models/subDomainModel");
const planModel = require("../models/planModel");
const subAdminModel = require("../models/subAdminModel");
const topicModel = require("../models/topicModel");
const subTopicModel = require("../models/subTopicModel");
const questionModel = require("../models/questionsModel");

exports.createSubDomain = catchAsyncError(async (req, res, next) => {
  const { sub_domain_name, domain_url, domain_reference, plans, description } =
    req.body;
  if (!sub_domain_name || !domain_url || !domain_reference) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  const existingSubDomain = await subDomainModel.findOne({
    sub_domain_name,
    domain_reference,
  });
  if (existingSubDomain) {
    return next(new ErrorHandler("Sub Domain name Already Exist", 400));
  }
  const results = plans.map((plan) =>
    planModel.create({ validity: plan.validity, price: plan.price })
  );
  const planArr = await Promise.all(results);
  const subDomain = await subDomainModel.create({
    sub_domain_name,
    domain_url,
    domain_reference,
    description,
    plans: planArr.map((data) => data._id),
  });

  res.status(201).json({
    success: true,
    subDomain,
    message: "Sub Domain Created Successfully",
  });
});

exports.getSubDomains = catchAsyncError(async (req, res, next) => {
  const { key, resultPerPage, currentPage, domain, getProfessorData } =
    req.query;
  let skip = 0;
  let limit;

  if (resultPerPage && currentPage) {
    skip = Number(currentPage - 1) * Number(resultPerPage);
    limit = Number(resultPerPage);
  }

  const query = {};
  if (key) query.sub_domain_name = { $regex: new RegExp(key, "i") };
  if (domain) {
    query.domain_reference = domain;
  }

  const findQuery = subDomainModel.find(query).populate("plans").skip(skip);
  if (limit) {
    findQuery.limit(limit);
  }

  const subDomains = await findQuery.lean();
  if (getProfessorData) {
    const subadmins = await subAdminModel.find().lean();
    for (let subdomain of subDomains) {
      for (let subadmin of subadmins) {
        console.log(subadmin.sub_domain, subdomain._id);
        if (
          subadmin.sub_domain
            .map((data) => data.toString())
            .includes(subdomain._id.toString())
        ) {
          if (!subdomain.professor) subdomain.professor = [];
          subdomain.professor.push(subadmin);
        }
      }
    }
  }
  res.status(200).json({
    success: true,
    subDomains,
    message: "Subdomains fetch Successfully",
  });
});

exports.deleteSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel.findByIdAndDelete(req.params.id);
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));

  res.status(200).json({
    success: true,
    message: "Subdomain Deleted Successfully",
  });
});

exports.getSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel
    .findById(req.params.id)
    .populate("plans");
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));

  res.status(200).json({
    success: true,
    subDomain,
    message: "SubDomain find Successfully",
  });
});

exports.updateSubDomain = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel.findById(req.params.id);
  if (!subDomain) return next(new ErrorHandler("Subdomain not found", 404));
  const { sub_domain_name, domain_url, domain_reference, description, plans } =
    req.body;
  if (
    sub_domain_name &&
    domain_reference &&
    subDomain.sub_domain_name != sub_domain_name
  ) {
    const subDomain = await subDomainModel.findOne({
      sub_domain_name,
      domain_reference,
    });
    if (subDomain)
      return next(new ErrorHandler("Subdomain Already Exist", 400));
  }
  if (plans.length > 0) {
    for (let plan of plans) {
      if (plan._id && plan._id != "null") {
        const existingPlan = await planModel.findById(plan._id);
        existingPlan = plan;
        // existingPlan = plan.validity;
        await existingPlan.save();
      } else {
        const newPlan = await planModel.create({
          price: plan.price,
          validity: plan.validity,
        });
        subDomain.plans.push(newPlan._id);
      }
    }
  }
  if (sub_domain_name) subDomain.sub_domain_name = sub_domain_name;
  if (domain_url) subDomain.domain_url = domain_url;
  if (description) subDomain.description = description;
  await subDomain.save();
  res.status(200).json({
    success: true,
    message: "Subdomain Updated Successfully",
  });
});

exports.viewSummary = catchAsyncError(async (req, res, next) => {
  const subDomain = await subDomainModel
    .findById(req.query.subdomain)
    .populate("domain_reference")
    .lean();
  const summary = {};
  summary.domain = subDomain.domain_reference.domain_name;
  summary.subdomain = subDomain.sub_domain_name;
  summary.topics = {};

  const topics = await topicModel
    .find({ sub_domain_reference: subDomain._id })
    .lean();
  for (let topic of topics) {
    summary.topics[topic.topic_name] = await subTopicModel
      .find({
        topic_reference: topic._id,
      })
      .lean();

    for (let subtopic of summary.topics[topic.topic_name]) {
      const questionsCount = await questionModel.countDocuments({
        sub_topic_reference: subtopic._id,
      });

      subtopic.questionsCount = questionsCount;
    }
  }

  res.status(200).json({
    success: true,
    summary,
    message: "SubDomain find Successfully",
  });
});
