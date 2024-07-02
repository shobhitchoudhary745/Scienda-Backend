const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const { getReport, getLowestMark } = require("../controllers/reportController");

const router = express.Router();

router.get("/get-report/:id", auth, getReport);
router.get("/get-lowest-report", auth, getLowestMark);

module.exports = router;
