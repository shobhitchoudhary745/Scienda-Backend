const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const { createTopic, getTopics, getTopic, deleteTopic, updateTopic } = require("../controllers/topicController");

const router = express.Router();

router.post("/create-topic", auth, isAdmin, createTopic);
router.get("/get-topics", getTopics);
router.get("/get-topic/:id", getTopic);
router.delete("/delete-topic/:id", auth, isAdmin, deleteTopic);
router.patch("/update-topic/:id", auth, isAdmin, updateTopic);

module.exports = router;
