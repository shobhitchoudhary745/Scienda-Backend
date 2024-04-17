const express = require("express");
const {
  registerAdmin,
  adminLogin,
  getSubAdminProfile,
  subAdminUpdateProfile,
} = require("../controllers/adminController");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");

router.post("/create-admin", registerAdmin);
router.post("/admin-login", adminLogin);
router.get("/get-subadmin/:id", auth, isAdmin, getSubAdminProfile);
router.patch(
  "/update-subadmin-profile/:id",
  auth,
  isAdmin,
  upload.single("image"),
  subAdminUpdateProfile
);

module.exports = router;
