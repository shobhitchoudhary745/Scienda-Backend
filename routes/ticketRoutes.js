const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const {
  createTicket,
  getTicket,
  deleteTicket,
  acceptRequest,
  postMessage,
  closedTicket,
  getAllTickets,
} = require("../controllers/ticketController");

const router = express.Router();

router.post("/create-ticket", auth, createTicket);
router.get("/get-ticket", auth, getTicket);
router.patch("/accept-ticket/:id", auth, acceptRequest);
router.patch("/close-ticket/:id", auth, closedTicket);
router.delete("/delete-ticket/:id", auth, deleteTicket);
router.patch("/post-message/:id", auth, postMessage);
router.get("/get-all-tickets", auth, getAllTickets);

module.exports = router;
