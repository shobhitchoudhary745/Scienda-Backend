const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const {
  createTicket,
  getTicket,
  deleteTicket,
  acceptRequest,
  postMessage,
  closedTicket,
} = require("../controllers/ticketController");

const router = express.Router();

router.post("/create-ticket", auth, createTicket);
router.get("/get-ticket", auth, getTicket);
router.patch("/accept-ticket/:id", auth, acceptRequest);
router.patch("/close-ticket/:id", auth, closedTicket);
router.delete("/delete-ticket/:id", auth, deleteTicket);
router.patch("/post-message/:id", auth, postMessage);

module.exports = router;
