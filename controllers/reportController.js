const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const reportModel = require("../models/reportModel");

exports.getReports = catchAsyncError(async (req, res, next) => {
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

exports.getReport = catchAsyncError(async (req, res, next) => {
  const report = await reportModel.findById(req.params.id).populate("test");
  if (!report) return next(new ErrorHandler("Report not found", 404));
  res.status(200).json({
    success: true,
    report,
    message: "Report find Successfully",
  });
});
