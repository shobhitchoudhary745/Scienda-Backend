const express = require("express");
const {
  registerSubAdmin,
  subAdminLogin,
  getAllSubAdmin,
  subAdminUpdateProfile,
  getSubAdminProfile,
  getOtp,
  submitOtp,
  resetPassword,
} = require("../controllers/subAdminController");
const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
const router = express.Router();

router.post("/create-subadmin", auth, isAdmin, registerSubAdmin);
router.post("/subadmin-login", subAdminLogin);
router.get("/get-subadmins", getAllSubAdmin);
router.patch(
  "/update-profile",
  auth,
  upload.single("image"),
  subAdminUpdateProfile
);
router.get("/get-subadmin-profile", auth, getSubAdminProfile);
router.post("/get-otp", getOtp);
router.post("/submit-otp", submitOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
