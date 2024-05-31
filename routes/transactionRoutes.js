const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const { getMyTransaction } = require("../controllers/transactionController");

const router = express.Router();


router.get("/get-user-transactions", auth, getMyTransaction);

module.exports = router;
