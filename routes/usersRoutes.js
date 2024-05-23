const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  register,
  login,
  submitOtpForEmailVerification,
  getMyProfile,
} = require("../controllers/userController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", submitOtpForEmailVerification);
router.get("/get-profile", auth, getMyProfile);

module.exports = router;
