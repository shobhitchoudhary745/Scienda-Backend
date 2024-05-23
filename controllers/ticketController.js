const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const ticketModel = require("../models/ticketModel");

exports.createTicket = catchAsyncError(async (req, res, next) => {
  const { to } = req.body;
  if (!to) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }

  const ticket = await ticketModel.create({
    from: req.userId,
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

exports.closedTicket = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);
  if (ticket.to == req.userId) {
    ticket.status = "Closed";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    topics,
    message: "Ticket Closed Successfully",
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

exports.getAllTickets = catchAsyncError(async (req, res, next) => {
  const { role, status } = req.query;
  const query = {};
  if (status) {
    query.status = status;
  }

  if (role == "User") query.from = req.userId;
  if (role == "Professor") query.to = req.userId;

  const tickets = await ticketModel.find(query).lean();
  res.status(200).json({
    success: true,
    tickets,
    message: "Tickets find Successfully",
  });
});
