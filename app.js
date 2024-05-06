const express = require("express");
const cors = require("cors");
const app = express();
const { error } = require("./middlewares/error");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const { upload, s3Uploadv2 } = require("./utils/s3");

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
      video_path:
        "https://creative-story.s3.amazonaws.com/test/1714469677377-WhatsApp+Video+2024-04-30+at+2.34.46+PM.mp4",
      data: [
        {
          description: "Indicates special status or mode change.",
          end_time: "2024-04-30 18:11:30",
          machine_name: "machine_1",
          machine_state: "white",
          start_time: "2024-04-30 18:11:22",
        },
        {
          description: "All good, no action needed.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "green",
          start_time: "2024-04-30 18:11:30",
        },
        {
          description: "All good, no action needed.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "green",
          start_time: "2024-04-30 18:11:30",
        },
        {
          description: "All good, no action needed.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "green",
          start_time: "2024-04-30 18:11:30",
        },
        {
          description: "All good, no action needed.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "green",
          start_time: "2024-04-30 18:11:30",
        },
        {
          description: "All good, no action needed.",
          end_time: "2024-04-30 18:12:35",
          machine_name: "machine_1",
          machine_state: "green",
          start_time: "2024-04-30 18:11:30",
        },
        {
          description: "Caution, address issue promptly to prevent escalation.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "yellow",
          start_time: "2024-04-30 18:12:35",
        },
        {
          description: "Caution, address issue promptly to prevent escalation.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "yellow",
          start_time: "2024-04-30 18:12:35",
        },
        {
          description: "Caution, address issue promptly to prevent escalation.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "yellow",
          start_time: "2024-04-30 18:12:35",
        },
        {
          description: "Caution, address issue promptly to prevent escalation.",
          end_time: "2024-04-30 18:13:51",
          machine_name: "machine_1",
          machine_state: "yellow",
          start_time: "2024-04-30 18:12:35",
        },
        {
          description: "Indicates special status or mode change.",
          end_time: 0,
          machine_name: "machine_1",
          machine_state: "white",
          start_time: "2024-04-30 18:13:51",
        },
        {
          description: "Indicates special status or mode change.",
          end_time: "2024-04-30 18:13:51",
          machine_name: "machine_1",
          machine_state: "white",
          start_time: "2024-04-30 18:13:51",
        },
      ],
    });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

app.post("/upload-video", upload.single("image"), async (req, res) => {
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
