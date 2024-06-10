const express = require("express");
const { isAdmin, auth, isNotUser } = require("../middlewares/auth");
const {
  createPage,
  getPages,
  deletePage,
  getPage,
  updatePage,
} = require("../controllers/professorSideContentManagementRoutes");

const router = express.Router();

router.post("/create-page", auth, isNotUser, createPage);
router.get("/get-pages", getPages);
router.delete("/delete-page/:id", auth, isNotUser, deletePage);
router.get("/get-page/:id", getPage);
router.patch("/update-page/:id", auth, isNotUser, updatePage);
module.exports = router;
