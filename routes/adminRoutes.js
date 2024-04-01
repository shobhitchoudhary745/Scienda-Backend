const express = require("express");
const { registerAdmin, adminLogin } = require("../controllers/adminController");
const router = express.Router();

router.post("/create-admin", registerAdmin);
router.post("/admin-login", adminLogin);

module.exports = router;
