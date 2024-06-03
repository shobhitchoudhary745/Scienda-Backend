const express = require("express");
const { auth, isNotUser } = require("../middlewares/auth");
const { getReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/get-report/:id", auth, getReport);

module.exports = router;
