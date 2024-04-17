const express = require("express");
const {
  registerSubAdmin,
  subAdminLogin,
  getAllSubAdmin,
  subAdminUpdateProfile,
  getSubAdminProfile,
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

module.exports = router;
