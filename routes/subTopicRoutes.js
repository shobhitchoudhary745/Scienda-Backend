const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const { createSubTopic, getSubTopic, getSubTopics, deleteSubTopic, updateSubTopic } = require("../controllers/subTopicController");

const router = express.Router();

router.post("/create-subtopic", auth, isAdmin, createSubTopic);
router.get("/get-subtopics", getSubTopics);
router.get("/get-subtopic/:id", getSubTopic);
router.delete("/delete-subtopic/:id", auth, isAdmin, deleteSubTopic);
router.patch("/update-subtopic/:id", auth, isAdmin, updateSubTopic);

module.exports = router;
