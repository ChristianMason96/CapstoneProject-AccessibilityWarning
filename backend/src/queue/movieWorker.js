console.log("Starting BullMQ worker...");

const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const { connection } = require("./connection");
const pool = require("../../db");
const { getFile } = require("../services/storageService");

const worker = new Worker(
  "movie-processing",
  async (job) => {
    console.log("Job received by Node worker:", job.data);

    const { dbJobId, fileReference } = job.data;

    await pool.query(
      `
      UPDATE jobs
      SET status = 'processing', started_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [dbJobId]
    );

    let moviePath;
    let storedFileName;

    if (fileReference.provider === "s3") {
      const tempDir = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "temp_downloads",
        fileReference.movieId || `movie_${Date.now()}`
      );

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      storedFileName = fileReference.fileName || fileReference.originalName;
      moviePath = path.join(tempDir, storedFileName);

      const fileBuffer = await getFile(fileReference);
      fs.writeFileSync(moviePath, fileBuffer);

      console.log("Downloaded S3 file to:", moviePath);
    } else {
      moviePath = fileReference.path;
      storedFileName = fileReference.fileName || fileReference.storedName || fileReference.originalName;
    }

    const pythonScript = path.join(__dirname, "..", "..", "..", "worker", "process_movie.py");

    await new Promise((resolve, reject) => {
      const python = spawn("python", [pythonScript, moviePath], {
        cwd: path.join(__dirname, "..", "..", ".."),
        stdio: "inherit"
      });

      python.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script failed with code ${code}`));
        }
      });

      python.on("error", (err) => {
        reject(err);
      });
    });

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

    if (!fs.existsSync(resultFilePath)) {
      throw new Error(`Results file not found: ${resultFilePath}`);
    }

    const rawResults = fs.readFileSync(resultFilePath, "utf-8");
    const parsedResults = JSON.parse(rawResults);

    const flashWarnings = parsedResults.flash_warnings || [];
    const audioWarnings = parsedResults.audio_warnings || [];
    const allWarnings = [...flashWarnings, ...audioWarnings];

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

    await pool.query(
      `
      UPDATE jobs
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [dbJobId]
    );

    console.log("Python script completed successfully.");
    return { success: true };
  },
  { connection }
);

worker.on("failed", async (job, err) => {
  try {
    if (job?.data?.dbJobId) {
      await pool.query(
        `
        UPDATE jobs
        SET status = 'failed', error_message = $2, completed_at = CURRENT_TIMESTAMP
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