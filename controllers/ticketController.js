const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const ticketModel = require("../models/ticketModel");
const userModel = require("../models/userModel");
const subAdminModel = require("../models/subAdminModel");
const { s3Uploadv2 } = require("../utils/s3");
const subadminNotification = require("../models/subadminNotificationModel");

exports.createTicket = catchAsyncError(async (req, res, next) => {
  const { subject, description, topic } = req.body;
  if (!subject || !description || !topic) {
    return next(new ErrorHandler("All Fields are required", 400));
  }

  let location = "";
  if (req.file) {
    const result = await s3Uploadv2(req.file);
    location = result.Location.split(".com")[1];
  }

  const user = await userModel.findById(req.userId);

  const ticket = await ticketModel.create({
    from: req.userId,

    subject,
    description,
    subdomain: user.subdomain,
    reference: location,
    topic,
  });

  // const notification = await subadminNotification.findOne({ owner: to });
  // notification.notifications.push(ticket._id);
  // await notification.save();

  res.status(201).json({
    success: true,
    ticket,
    message: "Ticket Created Successfully",
  });
});

exports.acceptRequest = catchAsyncError(async (req, res, next) => {
  const ticket = await ticketModel.findById(req.params.id);
  const subadmin = await subAdminModel.findById(req.userId);
  if (ticket?.subdomain?.toString() == subadmin.sub_domain.toString()) {
    ticket.status = "Open";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    message: "Ticket Accepted Successfully",
  });
});

exports.closedTicket = catchAsyncError(async (req, res, next) => {
  const subadmin = await subAdminModel.findById(req.userId);
  const ticket = await ticketModel.findById(req.params.id);
  if (ticket.subdomain.toString() == subadmin.sub_domain.toString()) {
    ticket.status = "Closed";
    await ticket.save();
  }

  res.status(200).json({
    success: true,
    message: "Ticket Closed Successfully",
  });
});

exports.postMessage = catchAsyncError(async (req, res, next) => {
  const { message, isAdmin } = req.body;
  const ticket = await ticketModel.findById(req.params.id);
  if (!ticket) return next(new ErrorHandler("Ticket no Found", 400));
  if (ticket.status == "Open") {
    ticket.chats.push({
      message,
      from: req.userId,
      date: new Date(),
      isAdmin: isAdmin ? isAdmin : false,
    });
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
  const { role, status, key } = req.query;
  const query = {};
  if (status) {
    query.status = status;
  }
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

  if (role == "User") query.from = req.userId;

  if (role == "Professor") {
    const subadmin = await subAdminModel.findById(req.userId);
    query.subdomain = subadmin.sub_domain;
  }
  let open = {},
    pending = {},
    closed = {},
    month = 0;
  open.year = 0;
  open.month = 0;
  pending.year = 0;
  pending.month = 0;
  closed.year = 0;
  closed.month = 0;

  let tickets = await ticketModel
    .find({
      ...query,
      createdAt: {
        $gte: startOfYear,
        $lt: endOfYear,
      },
    })
    .populate("topic")
    .populate("subdomain")
    .populate("from")
    .sort({ createdAt: -1 })
    .lean();

  if (key) {
    tickets = tickets.filter(
      (ticket) =>
        ticket.from.first_name.toLowerCase().includes(key.toLowerCase()) ||
        ticket.from.last_name.toLowerCase().includes(key.toLowerCase()) ||
        ticket.from.email.toLowerCase().includes(key.toLowerCase())
    );
  }

  for (let ticket of tickets) {
    if (ticket.status == "Open") {
      open.year += 1;
      if (ticket.createdAt >= startOfMonth && ticket.createdAt <= endOfMonth) {
        open.month += 1;
        month += 1;
      }
    } else if (ticket.status == "Pending") {
      pending.year += 1;
      if (ticket.createdAt >= startOfMonth && ticket.createdAt <= endOfMonth) {
        pending.month += 1;
        month += 1;
      }
    } else {
      closed.year += 1;
      if (ticket.createdAt >= startOfMonth && ticket.createdAt <= endOfMonth) {
        closed.month += 1;
        month += 1;
      }
    }
  }
  res.status(200).json({
    success: true,
    tickets,
    open,
    pending,
    closed,
    total: { year: tickets.length, month },
    message: "Tickets find Successfully",
  });
});
