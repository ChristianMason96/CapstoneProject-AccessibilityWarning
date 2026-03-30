console.log("Starting worker...");

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
    console.log("Job received:", job.data);

    return new Promise((resolve, reject) => {
      const python = spawn(
        "python",
        ["../worker/process_movie.py", job.data.moviePath, job.id],
        {
          cwd: __dirname,
          stdio: "inherit"
        }
      );

      python.on("close", (code) => {
        if (code === 0) resolve();
        else reject();
      });
    });
  },
  { connection }
);

console.log("Worker running...");