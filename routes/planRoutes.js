const express = require("express");
const {
  createPlan,
  getPlans,
  deletePlan,
  updatePlan,
} = require("../controllers/planController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/create-plan", auth, isAdmin, createPlan);
router.get("/get-plans", getPlans);
router.delete("/delete-plan/:id", auth, isAdmin, deletePlan);
router.patch("/update-plan/:id", auth, isAdmin, updatePlan);

module.exports = router;
