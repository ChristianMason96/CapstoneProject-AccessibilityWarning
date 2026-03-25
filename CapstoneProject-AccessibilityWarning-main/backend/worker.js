console.log("Starting BullMQ worker...");
const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "movie-processing",
  async (job) => {
    console.log("Job received by Node worker:", job.data);

    return new Promise((resolve, reject) => {
      const python = spawn("python", ["../worker/process_movie.py", job.data.moviePath], {
        cwd: __dirname,
        stdio: "inherit"
      });

      python.on("close", (code) => {
        if (code === 0) {
          console.log("Python script completed successfully.");
          resolve({ success: true });
        } else {
          reject(new Error(`Python script failed with code ${code}`));
        }
      });

      python.on("error", (err) => {
        reject(err);
      });
    });
  },
  { connection }
);

console.log("BullMQ worker is listening for jobs...");