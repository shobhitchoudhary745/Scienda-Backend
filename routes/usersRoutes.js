const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  register,
  login,
  submitOtpForEmailVerification,
  getMyProfile,
  deleteUser,
  updateProfile,
  getOtpToForgotPassword,
  submitOtpToForgotPassword,
  resetPassword,
  changePassword,
  resendOtp,
  sendInvoice,
  viewProficiencys,
  viewProficiency,
  getSubtopics,
  getTopic,
  getTestGraphData,
  getPieChart,
  getConfidenceData,
  getQuestionGraphData,
} = require("../controllers/userController");
const { upload } = require("../utils/s3");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", submitOtpForEmailVerification);
router.get("/get-profile", auth, getMyProfile);
router.delete("/delete-profile", auth, deleteUser);
router.patch("/update-profile", auth, upload.single("image"), updateProfile);
router.post("/getotp-to-forgot-password", getOtpToForgotPassword);
router.post("/submitotp-to-forgot-password", submitOtpToForgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", auth, changePassword);
router.post("/resend-otp", resendOtp);
router.get("/invoice", sendInvoice);
router.get("/view-proficiency", auth, viewProficiencys);
router.get("/view-proficiency/:id", auth, viewProficiency);
router.get("/get-topics/:id", auth, getSubtopics);
router.get("/get-topic/:id", auth, getTopic);
router.get("/get-user-test-data", auth, getTestGraphData);
router.get("/get-user-pie-chart", auth, getPieChart);
router.get("/get-user-confidence", auth, getConfidenceData);
router.get("/get-user-question-data", auth, getQuestionGraphData);

module.exports = router;
