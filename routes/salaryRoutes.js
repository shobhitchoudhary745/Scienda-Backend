const express = require("express");

const { auth } = require("../middlewares/auth");
const { getSalaries } = require("../controllers/salaryController");

const router = express.Router();

router.get("/get-salaries", auth, getSalaries);

module.exports = router;
