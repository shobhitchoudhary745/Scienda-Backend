const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  register,
  login,
  submitOtpForEmailVerification,
  getMyProfile,
  deleteUser,
  updateProfile,
} = require("../controllers/userController");
const { upload } = require("../utils/s3");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", submitOtpForEmailVerification);
router.get("/get-profile", auth, getMyProfile);
router.delete("/delete-profile", auth, deleteUser);
router.patch("/update-profile", auth, upload.single("image"), updateProfile);

module.exports = router;
