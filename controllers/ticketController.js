const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const ticketModel = require("../models/ticketModel");
const userModel = require("../models/userModel");
const { s3Uploadv2 } = require("../utils/s3");
const subadminNotification = require("../models/subadminNotificationModel");

exports.createTicket = catchAsyncError(async (req, res, next) => {
  const { to, subject, description, topic } = req.body;
  if (!to || !subject || !description || !topic) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }

  let location = "";
  if (req.file) {
    const result = await s3Uploadv2(req.file);
    location = result.Location.split(".com")[1];
  }

  const user = await userModel.findById(req.userId);

  const ticket = await ticketModel.create({
    from: req.userId,
    to,
    subject,
    description,
    subdomain: user.subdomain,
    reference: location,
    topic,
  });

  const notification = await subadminNotification.findOne({ owner: to });
  notification.notifications.push(ticket._id);
  await notification.save();

  res.status(201).json({
    success: true,
    ticket,
    message: "Ticket Created Successfully",
  });
});

exports.acceptRequest = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);
  if (ticket.to == req.userId) {
    ticket.status = "Open";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    message: "Ticket Accepted Successfully",
  });
});

exports.closedTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);
  if (ticket.to == req.userId) {
    ticket.status = "Closed";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    message: "Ticket Closed Successfully",
  });
});

exports.postMessage = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const ticket = await ticketModel.findById(req.params.id);
  if (!ticket) return next(new ErrorHandler("Ticket no Found", 400));
  if (ticket.status == "Open") {
    ticket.chats.push({ message, from: req.userId, date: new Date() });
    await ticket.save();
  }

  res.status(200).json({
    success: true,
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
  const ticket = await ticketModel
    .findById(req.params.id)
    .populate("topic")
    .populate("subdomain")
    .populate("from")
    .lean();
  if (!ticket) return next(new ErrorHandler("Ticket not found", 404));
  res.status(200).json({
    success: true,
    ticket,
    message: "Ticket find Successfully",
  });
});

exports.getAllTickets = catchAsyncError(async (req, res, next) => {
  const { role, status } = req.query;
  const query = {};
  if (status) {
    query.status = status;
  }

  if (role == "User") query.from = req.userId;
  if (role == "Professor") query.to = req.userId;
  let open = 0,
    pending = 0,
    closed = 0;

  const tickets = await ticketModel
    .find(query)
    .populate("topic")
    .populate("subdomain")
    .populate("from")
    .lean();

  for (let ticket of tickets) {
    if (ticket.status == "Open") open += 1;
    else if (ticket.status == "Pending") pending += 1;
    else closed += 1;
  }
  res.status(200).json({
    success: true,
    tickets,
    open,
    pending,
    closed,
    total: tickets.length,
    message: "Tickets find Successfully",
  });
});
