const express = require("express");
const {
  registerAdmin,
  adminLogin,
  getSubAdminProfile,
  subAdminUpdateProfile,
  getOtp,
  submitOtp,
  resetPassword,
  getTickets,
  getTicket,
  acceptRequest,
  closedTicket,
  getStatics,
  deleteTicket,
  getUsers,
  getPayments,
  getUsersGraphData,
  getAllPayments,
} = require("../controllers/adminController");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");

router.post("/create-admin", registerAdmin);
router.post("/admin-login", adminLogin);
router.get("/get-subadmin/:id", auth, isAdmin, getSubAdminProfile);
router.get("/get-statics", auth, isAdmin, getStatics);
router.patch(
  "/update-subadmin-profile/:id",
  auth,
  isAdmin,
  upload.single("image"),
  subAdminUpdateProfile
);
router.post("/get-otp", getOtp);
router.post("/submit-otp", submitOtp);
router.post("/reset-password", resetPassword);
router.get("/get-tickets", auth, isAdmin, getTickets);
router.get("/get-ticket/:id", auth, isAdmin, getTicket);
router.patch("/accept-ticket/:id", auth, isAdmin, acceptRequest);
router.patch("/close-ticket/:id", auth, isAdmin, closedTicket);
router.delete("/delete-ticket/:id", auth, isAdmin, deleteTicket);
router.get("/get-users", getUsers);
router.get("/get-payments", auth, isAdmin, getPayments);
router.get("/get-users-graph-data", auth, isAdmin, getUsersGraphData);
router.get("/get-all-transactions", auth, isAdmin, getAllPayments);

module.exports = router;
