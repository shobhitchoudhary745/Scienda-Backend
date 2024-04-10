const express = require("express");
const {
  registerSubAdmin,
  subAdminLogin,
} = require("../controllers/subAdminController");
const { auth, isAdmin } = require("../middlewares/auth");
const router = express.Router();

router.post("/create-subadmin", auth, isAdmin, registerSubAdmin);
router.post("/subadmin-login", subAdminLogin);

module.exports = router;
