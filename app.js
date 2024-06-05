const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const { upload, s3Uploadv2 } = require("./utils/s3");
require("./utils/cronJobs");

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

app.post("/upload", async (req, res) => {
  try {
    res.status(200).json({
      video_name:
        "https://creative-story.s3.amazonaws.com/test/1714469677377-WhatsApp+Video+2024-04-30+at+2.34.46+PM.mp4",
      data: [
        {
          machine_name: "machine_1",
          machine_state: "green",
          description: "All good, running fine.",
          start_time: "2024-05-20 07:17:58",
          end_time: 0,
          duration: 0.0,
        },
        {
          machine_name: "machine_1",
          machine_state: "green",
          description: "All good, running fine.",
          start_time: "2024-05-20 07:17:58",
          end_time: "2024-05-20 07:18:22",
          duration: 24.0,
        },
        {
          machine_name: "machine_1",
          machine_state: "yellow",
          description: "Waiting on Material.",
          start_time: "2024-05-20 07:18:22",
          end_time: 0,
          duration: 0.0,
        },
        {
          machine_name: "machine_1",
          machine_state: "yellow",
          description: "Waiting on Material.",
          start_time: "2024-05-20 07:18:22",
          end_time: "2024-05-20 07:18:38",
          duration: 16.0,
        },
      ],
      statistics: {
        total_duration: 40,
        max_duration_state: "green",
        min_duration_state: "yellow",
        max_duration_time: 24.0,
        min_duration_time: 16.0,
        downtime_duration: 16.0,
        downtime_percentage: 40.0,
      },
    });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

app.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (req.file) {
      const result = await s3Uploadv2(req.file);
      res.status(200).json({ location: result.Location });
    }
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

// import routes
const adminRoutes = require("./routes/adminRoutes");
const planRoutes = require("./routes/planRoutes");
const contentManagementRoutes = require("./routes/contentManagementRoutes");
const domainRoutes = require("./routes/domainRoutes");
const subDomainRoutes = require("./routes/subDomainRoutes");
const userRoutes = require("./routes/usersRoutes");
const subAdminRoutes = require("./routes/subAdminRoutes");
const topicRoutes = require("./routes/topicRoutes");
const subTopicRoutes = require("./routes/subTopicRoutes");
const questionRoute = require("./routes/questionRoutes");
const testRoutes = require("./routes/testRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const orderRoutes = require("./routes/orderRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const bankRoutes = require("./routes/bankRoutes");
const { router } = require("./utils/stripe");

//import validators
// const userValidator = require("./validators/user.validator.js");

// use routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/pages", contentManagementRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/sub-domain", subDomainRoutes);
app.use("/api/subadmin", subAdminRoutes);
app.use("/api/topic", topicRoutes);
app.use("/api/subtopic", subTopicRoutes);
app.use("/api/question", questionRoute);
app.use("/api/test", testRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/bank", bankRoutes);
app.use(router);

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
