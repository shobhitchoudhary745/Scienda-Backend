const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("tiny"));
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
const topicRoutes = require("./routes/topicRoutes");
const subTopicRoutes = require("./routes/subTopicRoutes");
const questionRoute = require("./routes/questionRoutes");
const testRoutes = require("./routes/testRoutes");

//import validators
// const userValidator = require("./validators/user.validator.js");

// use routes
app.use("/api/admin", adminRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/pages", contentManagementRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/sub-domain", subDomainRoutes);
app.use("/api/subadmin", subAdminRoutes);
app.use("/api/topic", topicRoutes);
app.use("/api/subtopic", subTopicRoutes);
app.use("/api/question", questionRoute);
app.use("/api/test", testRoutes);

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
