const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const {
  createTicket,
  getTicket,
  deleteTicket,
  acceptRequest,
  postMessage,
} = require("../controllers/ticketController");

const router = express.Router();

router.post("/create-ticket", auth, createTicket);
router.get("/get-ticket", getTicket);
router.patch("/accept-ticket/:id", auth, acceptRequest);
router.delete("/delete-ticket/:id", auth, deleteTicket);
router.patch("/post-message/:id", auth, postMessage);

module.exports = router;
