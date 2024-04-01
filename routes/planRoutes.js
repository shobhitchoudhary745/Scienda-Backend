const express = require("express");
const { createPlan, getPlans } = require("../controllers/planController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/create-plan", auth, isAdmin, createPlan);
router.get("/get-plans", getPlans);

module.exports = router;
