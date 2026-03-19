console.log("Starting BullMQ worker...");

const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const path = require("path");
const { connection } = require("./connection");

const worker = new Worker(
  "movie-processing",
  async (job) => {
    console.log("Job received by Node worker:", job.data);

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, "..", "..", "..", "worker", "process_movie.py");

      const python = spawn("python", [pythonScript, job.data.moviePath], {
        cwd: path.join(__dirname, "..", "..", ".."),
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