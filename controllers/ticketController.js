const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const ticketModel = require("../models/ticketModel");

exports.createTicket = catchAsyncError(async (req, res, next) => {
  const { from, to } = req.body;
  if (!from || !to) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }

  const ticket = await ticketModel.create({
    from,
    to,
  });

  res.status(201).json({
    success: true,
    ticket,
    message: "Ticket Created Successfully",
  });
});

exports.acceptRequest = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);
  if (ticket.to == req.userId) {
    ticket.status = "Accepted";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    topics,
    message: "Ticket Accepted Successfully",
  });
});

exports.postMessage = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const ticket = await ticketModel.findById(req.params.id);
  if (!ticket) return next(new ErrorHandler("Ticket no Found", 400));
  if (ticket.status == "Accepted") {
    ticket.chats.push({ message, from: req.userId });
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    topics,
    message: "Message Posted Successfully",
  });
});

exports.deleteTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findByIdAndDelete(req.params.id);
  if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

  res.status(200).json({
    success: true,
    message: "Ticket Deleted Successfully",
  });
});

exports.getTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id).lean();
  if (!ticket) return next(new ErrorHandler("Ticket not found", 404));
  res.status(200).json({
    success: true,
    ticket,
    message: "Ticket find Successfully",
  });
});

// exports.updateTopic = catchAsyncError(async (req, res, next) => {
//   const topic = await topicModel.findById(req.params.id);
//   if (!topic) return next(new ErrorHandler("Topic not found", 404));
//   const { topic_name, sub_domain_reference, description, references, images } =
//     req.body;
//   if (topic_name && sub_domain_reference && topic.topic_name != topic_name) {
//     const topic = await topicModel.findOne({
//       topic_name,
//       sub_domain_reference,
//     });
//     if (topic) return next(new ErrorHandler("Topic Already Exist", 400));
//   }
//   if (topic_name) topic.topic_name = topic_name;
//   if (description) topic.description = description;
//   if (sub_domain_reference) topic.sub_domain_reference = sub_domain_reference;
//   if (references)
//     topic.references =
//       typeof references === "string" ? [references] : references;
//   let image = [];
//   if (req.files) {
//     const results = await s3UploadMulti(req.files);
//     image = results.map((data) => data.Location.split(".com")[1]);
//   }
//   if (images)
//     topic.images = [...images.filter((image) => image != ""), ...image];
//   else topic.images = [...image];
//   await topic.save();
//   res.status(200).json({
//     success: true,
//     message: "Topic updated Successfully",
//   });
// });
