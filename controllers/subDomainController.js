const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const subDomainModel = require("../models/subDomainModel");
const planModel = require("../models/planModel");
const subAdminModel = require("../models/subAdminModel");
const topicModel = require("../models/topicModel");
const subTopicModel = require("../models/subTopicModel");
const questionModel = require("../models/questionsModel");
const transactionModel = require("../models/transactionModel");
const userModel = require("../models/userModel");
const axios = require("axios");

exports.createSubDomain = catchAsyncError(async (req, res, next) => {
  const { sub_domain_name, domain_url, domain_reference, plans, description } =
    req.body;
  if (!sub_domain_name || !domain_url || !domain_reference) {
    return next(new ErrorHandler("All Fields are required", 400));
  }
  const existingSubDomain = await subDomainModel.findOne({
    sub_domain_name,
    domain_reference,
  });
  if (existingSubDomain) {
    return next(new ErrorHandler("Sub Domain name Already Exist", 400));
  }
  const data = await axios.post(process.env.CREATE_DOMAIN_URL, {
    domain: domain_url,
  });
  const results = plans.map((plan) =>
    planModel.create({
      validity: plan.validity,
      price: plan.price,
      features: plan.features,
    })
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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const { key, resultPerPage, currentPage, domain, getProfessorData } =
    req.query;
  let skip = 0;
  let limit;
  let amount = 0;
  let monthlyAmount = 0,
    monthlyTransaction = 0;
  const transactions = await transactionModel
    .find({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    })
    .lean();
  for (let transaction of transactions) {
    amount += transaction.amount;
    if (
      transaction.createdAt >= startOfMonth &&
      transaction.createdAt <= endOfMonth
    ) {
      monthlyAmount += transaction.amount;
      monthlyTransaction += 1;
    }
  }
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

  const subDomains = await findQuery
    .lean()
    .sort({ sub_domain_name: 1 })
    .collation({ locale: "en", strength: 2 });
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
    totalAmountReceived: amount,
    totalTransaction: transactions.length,
    monthlyTransaction,
    monthlyAmount,
    message: "Subdomains fetch Successfully",
  });
});

exports.deleteSubDomain = catchAsyncError(async (req, res, next) => {
  const userCount = await userModel.countDocuments({
    sub_domain: { $in: [req.params.id] },
  });
  if (userCount > 0)
    return next(
      new ErrorHandler(
        "You can not delete this subdomain as one or more Users are registered under this",
        400
      )
    );

  const professorCount = await subAdminModel.countDocuments({
    sub_domain: req.params.id,
  });
  if (professorCount > 0)
    return next(
      new ErrorHandler(
        "You can not delete this subdomain as one or more Professors are registered under this",
        400
      )
    );

  const topicCount = await topicModel.countDocuments({
    sub_domain_reference: req.params.id,
  });
  if (topicCount > 0)
    return next(
      new ErrorHandler(
        "You can not delete this subdomain as one or more Topics are registered under this",
        400
      )
    );

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
          features: plan.features,
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
    summary.topics[topic.topic_name] = {};
    summary.topics[topic.topic_name].questionsCount = 0;
    summary.topics[topic.topic_name].topic_reference = topic._id;

    summary.topics[topic.topic_name].subtopics = await subTopicModel
      .find({
        topic_reference: topic._id,
      })
      .lean();

    for (let subtopic of summary.topics[topic.topic_name].subtopics) {
      const questionsCount = await questionModel.countDocuments({
        sub_topic_reference: subtopic._id,
      });

      subtopic.questionsCount = questionsCount;
      summary.topics[topic.topic_name].questionsCount += questionsCount;
    }
  }

  res.status(200).json({
    success: true,
    summary,
    message: "SubDomain find Successfully",
  });
});
