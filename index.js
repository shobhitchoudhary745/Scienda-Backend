const app = require("./app");
const { connectDB } = require("./config/database");
const cluster = require("cluster");
cluster.schedulingPolicy = cluster.SCHED_RR;
const totalCpus = require("os").cpus();


connectDB();
const port = process.env.PORT || 4000; 

// if (cluster.isMaster) {
//   totalCpus.forEach(async (node) => {
//     await cluster.fork();
//   });
//   cluster.on("exit", async (worker, code, signal) => {
//     await cluster.fork();
//   });
// } else {
  app.listen(port, () => {
    console.log("Server is running")
  });
// }


