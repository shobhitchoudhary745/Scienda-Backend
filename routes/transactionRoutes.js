const express = require("express");
const { auth, isAdmin, isNotUser } = require("../middlewares/auth");
const {
  getMyTransaction,
  getAllTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/get-user-transactions", auth, getMyTransaction);
router.get("/get-all-transactions", auth, isNotUser, getAllTransaction);

module.exports = router;
