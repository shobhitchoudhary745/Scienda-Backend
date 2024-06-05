const express = require("express");

const { auth, isAdmin } = require("../middlewares/auth");
const { addBank } = require("../controllers/bankController");

const router = express.Router();

router.post("/add-bank", addBank);
// router.get("/get-plans", getPlans);

module.exports = router;
