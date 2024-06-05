const express = require("express");

const { auth, isAdmin } = require("../middlewares/auth");
const { addBank, login } = require("../controllers/bankController");

const router = express.Router();

router.post("/add-bank", addBank);
router.post("/login", login);

module.exports = router;
