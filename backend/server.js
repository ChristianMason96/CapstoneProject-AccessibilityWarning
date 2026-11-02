
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const { movieQueue } = require("./queue");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 250);

const allowedExtensions = new Set([
  ".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"
]);

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:4200"
  })
);

app.use(express.json());

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024,
    files: 1
  },

  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype || "";

    const videoMime =
      mime.startsWith("video/") ||
      mime === "application/octet-stream";

    if (!allowedExtensions.has(extension) || !videoMime) {
      return cb(
        new Error(
          "Please upload a supported video file (MP4, MOV, M4V, WEBM, MKV or AVI)."
        )
      );
    }

    cb(null, true);
  }
});

function acceptMovieUpload(req, res, next) {
  upload.single("movie")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `Movie exceeds the ${MAX_UPLOAD_MB} MB upload limit.`
        });
      }

      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(400).json({
      error: error.message
    });
  });
}

app.get("/", (_req, res) => {
  res.send("Backend is running.");
});

app.post("/upload", acceptMovieUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No movie file uploaded"
    });
  }

  let client;
  let committed = false;
  let queued = false;
  let dbJobId;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const mediaResult = await client.query(
      `INSERT INTO media_files
       (original_filename, stored_filename, file_path)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [
        req.file.originalname,
        req.file.filename,
        req.file.path
      ]
    );

    const mediaFileId = mediaResult.rows[0].id;

    const jobResult = await client.query(
      `INSERT INTO jobs (media_file_id, status)
       VALUES ($1, 'queued')
       RETURNING id`,
      [mediaFileId]
    );

    dbJobId = jobResult.rows[0].id;

    const jobId = `movie-${dbJobId}`;

    await client.query(
      `UPDATE jobs
       SET bullmq_job_id = $1
       WHERE id = $2`,
      [jobId, dbJobId]
    );

    // The DB transaction is committed before the worker can receive the job.
    await client.query("COMMIT");
    committed = true;

    await movieQueue.add(
      "process-movie",
      {
        dbJobId,
        mediaFileId,
        moviePath: req.file.path,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        uploadedAt: new Date().toISOString()
      },
      {
        jobId
      }
    );

    queued = true;

    return res.status(201).json({
      message: "Movie uploaded and job created",
      jobId,
      status: "queued",
      fileName: req.file.originalname
    });

  } catch (error) {
    if (client && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Database rollback failed:", rollbackError);
      }
    }

    if (committed && !queued && dbJobId) {
      try {
        await pool.query(
          `UPDATE jobs
           SET status = 'failed',
               error_message = $2,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [
            dbJobId,
            "Unable to queue movie for processing"
          ]
        );
      } catch (statusError) {
        console.error(
          "Could not update failed queue status:",
          statusError
        );
      }
    }

    if (!queued) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (_) {
        // No uploaded file to remove.
      }
    }

    console.error("Upload failed:", error);

    return res.status(500).json({
      error: "Movie upload could not be queued. Please try again."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/jobs/:jobId/warnings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         j.id AS db_job_id,
         j.bullmq_job_id,
         j.status,
         j.error_message,
         m.original_filename,
         m.stored_filename,
         ws.id AS warning_id,
         ws.warning_type,
         ws.start_time,
         ws.end_time,
         ws.severity,
         ws.confidence,
         ws.detection_mode,
         ws.event_count
       FROM jobs j
       JOIN media_files m
         ON j.media_file_id = m.id
       LEFT JOIN warning_segments ws
         ON ws.job_id = j.id
       WHERE j.bullmq_job_id = $1
       ORDER BY ws.start_time ASC, ws.id ASC`,
      [req.params.jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    const firstRow = result.rows[0];

    const warnings = result.rows
      .filter(row => row.warning_id !== null)
      .map(row => ({
        id: row.warning_id,
        warning_type: row.warning_type,
        start_time: Number(row.start_time),
        end_time: Number(row.end_time),
        severity: row.severity,
        confidence:
          row.confidence === null
            ? null
            : Number(row.confidence),
        detection_mode: row.detection_mode,
        event_count: row.event_count
      }));

    return res.json({
      dbJobId: firstRow.db_job_id,
      jobId: firstRow.bullmq_job_id,
      status: firstRow.status,
      error: firstRow.error_message,
      fileName: firstRow.original_filename,
      storedFileName: firstRow.stored_filename,
      warnings
    });

  } catch (error) {
    console.error("Failed to fetch warnings:", error);

    return res.status(500).json({
      error: "Failed to fetch warnings"
    });
  }
});

app.get("/jobs/:jobId/status", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         bullmq_job_id,
         status,
         error_message,
         created_at,
         started_at,
         completed_at
       FROM jobs
       WHERE bullmq_job_id = $1`,
      [req.params.jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    const job = result.rows[0];

    return res.json({
      jobId: job.bullmq_job_id,
      status: job.status,
      error: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at
    });

  } catch (error) {
    console.error("Failed to retrieve job status:", error);

    return res.status(500).json({
      error: "Failed to retrieve job status"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
