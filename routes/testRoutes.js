const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");

const {
  createTest,
  getTests,
  getTest,
  deleteTest,
  updateTest,
  submitTest,
} = require("../controllers/testController");

const router = express.Router();

router.post("/create-test", auth, isNotUser, createTest);
router.get("/get-tests", auth, getTests);
router.get("/get-test/:id", auth, getTest);
router.delete("/delete-test/:id", auth, isNotUser, deleteTest);
router.patch("/update-test/:id", auth, isNotUser, updateTest);
router.post("/submit-test", auth, submitTest);

module.exports = router;
