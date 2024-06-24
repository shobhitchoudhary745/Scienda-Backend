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

module.exports = router;
