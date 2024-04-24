const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");

const { upload } = require("../utils/s3");
const {
  createQuestion,
  getQuestions,
  getQuestion,
  deleteQuestion,
  updateQuestion,
} = require("../controllers/questionsController");

const router = express.Router();

router.post(
  "/create-question",
  auth,
  isNotUser,
  upload.array("image"),
  createQuestion
);
router.get("/get-questions", getQuestions);
router.get("/get-question/:id", getQuestion);
router.delete("/delete-question/:id", auth, isNotUser, deleteQuestion);
router.patch(
  "/update-question/:id",
  auth,
  isNotUser,
  upload.array("image"),
  updateQuestion
);

module.exports = router;
