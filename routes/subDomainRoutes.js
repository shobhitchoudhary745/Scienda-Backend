const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  createSubDomain,
  getSubDomains,
  getSubDomain,
  deleteSubDomain,
  updateSubDomain,
} = require("../controllers/subDomainController");

const router = express.Router();

router.post("/create-sub-domain", auth, isAdmin, createSubDomain);
router.get("/get-sub-domains", getSubDomains);
router.get("/get-sub-domain/:id", getSubDomain);
router.delete("/delete-sub-domain/:id", auth, isAdmin, deleteSubDomain);
router.patch("/update-sub-domain/:id", auth, isAdmin, updateSubDomain);

module.exports = router;
