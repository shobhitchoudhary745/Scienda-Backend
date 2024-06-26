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
  getStatics,
  getModifiedTest,
  getModifiedQuestion,
  getUserGraphData,
  getSalaryGraphData,
  questionToBeModified,
  getTimedOutTest,
  getQuestionsGraphData,
  getTestsGraphData,
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
router.get("/get-statics", getStatics);
router.get("/get-modified-test", auth, getModifiedTest);
router.get("/get-modified-question", auth, getModifiedQuestion);
router.get("/get-user-graph-data", auth, getUserGraphData);
router.get("/get-salary-graph-data", auth, getSalaryGraphData);
router.get("/get-question-graph-data",  getQuestionsGraphData);
router.get("/get-test-graph-data", auth, getTestsGraphData);
router.get("/question-tobe-modified", auth, questionToBeModified);
router.get("/timed-out-test", auth, getTimedOutTest);

module.exports = router;
