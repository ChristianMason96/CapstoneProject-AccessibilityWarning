console.log("Starting BullMQ worker...");

const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const { connection } = require("./connection");
const pool = require("../../db");

// Create the BullMQ worker to listen for job from the python worker
const worker = new Worker(
  "movie-processing",
  async (job) => {
    console.log("Job received by Node worker:", job.data);

    const { dbJobId, moviePath, storedFileName } = job.data;

// Job gets marked as processing in Postgre
  await pool.query(
    `
    UPDATE jobs
    SET
      status = 'processing',
      started_at = CURRENT_TIMESTAMP,
      completed_at = NULL,
      error_message = NULL
    WHERE id = $1
    `,
    [dbJobId]
  );

// Path to python movie script
    const pythonScript = path.join(__dirname, "..", "..", "..", "worker", "process_movie.py");

    await new Promise((resolve, reject) => {
      const python = spawn("python", [pythonScript, moviePath], {
        cwd: path.join(__dirname, "..", "..", ".."),
        stdio: "inherit"
      });

// Check if job finishes succesfully, if not it fails
      python.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script failed with code ${code}`));
        }
      });

// Error handling on startup
      python.on("error", (err) => {
        reject(err);
      });
    });

// Find JSON result after script
    const movieName = path.parse(storedFileName).name;
    const resultFilePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "output",
      "results",
      `${movieName}_results.json`
    );

// Stop if JSON file was not found
    if (!fs.existsSync(resultFilePath)) {
      throw new Error(`Results file not found: ${resultFilePath}`);
    }

// Read and Parse warning results then combine flash and audio to be stored 
    const rawResults = fs.readFileSync(resultFilePath, "utf-8");
    const parsedResults = JSON.parse(rawResults);

    const flashWarnings = parsedResults.flash_warnings || [];
    const audioWarnings = parsedResults.audio_warnings || [];
    const allWarnings = [...flashWarnings, ...audioWarnings];

// Save warning segments to Postgre 
    for (const warning of allWarnings) {
      await pool.query(
        `
        INSERT INTO warning_segments
        (job_id, warning_type, start_time, end_time, severity, confidence, detection_mode, event_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          dbJobId,
          warning.warning_type,
          warning.start_time,
          warning.end_time,
          warning.severity,
          warning.confidence,
          warning.detection_mode || null,
          warning.event_count || 1
        ]
      );
    }

// Mark job as complete after saving warnings
  await pool.query(
    `
    UPDATE jobs
    SET
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      error_message = NULL
    WHERE id = $1
    `,
    [dbJobId]
  );

    console.log("Python script completed successfully.");
    return { success: true };
  },
  {

// Give time to large processing jobs before treating them as stalled
    connection,
    lockDuration: 600000,
    stalledInterval: 30000,
    maxStalledCount: 3
  }
);

// If job fails store the state and error message to Postgre
worker.on("failed", async (job, err) => {
  try {
    if (job?.data?.dbJobId) {
      await pool.query(
          `
        UPDATE jobs
        SET
          status = 'failed',
          error_message = $2,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [job.data.dbJobId, err.message]
      );
    }
  } catch (dbErr) {
    console.error("Failed to update job failure status:", dbErr);
  }

  console.error("Worker job failed:", err);
});

console.log("BullMQ worker is listening for jobs...");