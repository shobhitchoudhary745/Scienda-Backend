const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const { createOrder } = require("../controllers/orderController");

const router = express.Router();

router.post("/create-order", createOrder);

module.exports = router;
