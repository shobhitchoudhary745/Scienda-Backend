const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const {
  createSubTopic,
  getSubTopic,
  getSubTopics,
  deleteSubTopic,
  updateSubTopic,
} = require("../controllers/subTopicController");
const { upload } = require("../utils/s3");

const router = express.Router();

router.post(
  "/create-subtopic",
  auth,
  isNotUser,
  upload.array("image"),
  createSubTopic
);
router.get("/get-subtopics", getSubTopics);
router.get("/get-subtopic/:id", getSubTopic);
router.delete("/delete-subtopic/:id", auth, isNotUser, deleteSubTopic);
router.patch(
  "/update-subtopic/:id",
  auth,
  isNotUser,
  upload.array("image"),
  updateSubTopic
);

module.exports = router;
