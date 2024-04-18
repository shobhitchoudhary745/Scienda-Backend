const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const {
  createTopic,
  getTopics,
  getTopic,
  deleteTopic,
  updateTopic,
} = require("../controllers/topicController");
const { upload } = require("../utils/s3");

const router = express.Router();

router.post(
  "/create-topic",
  auth,
  isNotUser,
  upload.array("image"),
  createTopic
);
router.get("/get-topics", getTopics);
router.get("/get-topic/:id", getTopic);
router.delete("/delete-topic/:id", auth, isNotUser, deleteTopic);
router.patch(
  "/update-topic/:id",
  auth,
  isNotUser,
  upload.array("image"),
  updateTopic
);

module.exports = router;
