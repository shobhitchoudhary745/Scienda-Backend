const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// import routes
const adminRoutes = require("./routes/adminRoutes");
const planRoutes = require("./routes/planRoutes");
const contentManagementRoutes = require("./routes/contentManagementRoutes");
const domainRoutes = require("./routes/domainRoutes");
const subDomainRoutes = require("./routes/subDomainRoutes");
const subAdminRoutes = require("./routes/subAdminRoutes");

//import validators
// const userValidator = require("./validators/user.validator.js");

// use routes
app.use("/api/admin", adminRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/pages", contentManagementRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/sub-domain", subDomainRoutes);
app.use("/api/subadmin", subAdminRoutes);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;

app.use(error);
