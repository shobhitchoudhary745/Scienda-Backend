const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  createDomain,
  getDomains,
  getDomain,
  deleteDomain,
  updateDomain,
} = require("../controllers/domainController");

const router = express.Router();

router.post("/create-domain", auth, isAdmin, createDomain);
router.get("/get-domains", getDomains);
router.get("/get-domain/:id", getDomain);
router.delete("/delete-domain/:id", auth, isAdmin, deleteDomain);
router.patch("/update-domain/:id", auth, isAdmin, updateDomain);

module.exports = router;
