const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");

const {
  createTest,
  getTests,
  getTest,
  deleteTest,
  updateTest,
} = require("../controllers/testController");

const router = express.Router();

router.post("/create-test", auth, isNotUser, createTest);
router.get("/get-tests", getTests);
router.get("/get-test/:id", getTest);
router.delete("/delete-test/:id", auth, isNotUser, deleteTest);
router.patch("/update-test/:id", auth, isNotUser, updateTest);

module.exports = router;
