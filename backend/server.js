const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { movieQueue } = require("./queue");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

app.post("/upload", upload.single("movie"), async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No movie file uploaded" });
    }

    const filePath = req.file.path;
    const originalFileName = req.file.originalname;
    const storedFileName = req.file.filename;

    await client.query("BEGIN");

    const mediaResult = await client.query(
      `
      INSERT INTO media_files (original_filename, stored_filename, file_path)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [originalFileName, storedFileName, filePath]
    );

    const mediaFileId = mediaResult.rows[0].id;

    const jobRowResult = await client.query(
      `
      INSERT INTO jobs (media_file_id, status)
      VALUES ($1, 'queued')
      RETURNING id
      `,
      [mediaFileId]
    );

    const dbJobId = jobRowResult.rows[0].id;

    const bullJob = await movieQueue.add("process-movie", {
      dbJobId,
      mediaFileId,
      moviePath: filePath,
      originalFileName,
      storedFileName,
      uploadedAt: new Date().toISOString()
    });

    await client.query(
      `
      UPDATE jobs
      SET bullmq_job_id = $1
      WHERE id = $2
      `,
      [String(bullJob.id), dbJobId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Movie uploaded and job created",
      jobId: bullJob.id,
      dbJobId,
      file: {
        originalName: originalFileName,
        storedName: storedFileName,
        path: filePath
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  } finally {
    client.release();
  }
});

app.get("/jobs/:jobId/warnings", async (req, res) => {
  try {
    const bullmqJobId = req.params.jobId;

    const result = await pool.query(
      `
      SELECT
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
      JOIN media_files m ON j.media_file_id = m.id
      LEFT JOIN warning_segments ws ON ws.job_id = j.id
      WHERE j.bullmq_job_id = $1
      ORDER BY ws.start_time ASC
      `,
      [bullmqJobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
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
        confidence: row.confidence !== null ? Number(row.confidence) : null,
        detection_mode: row.detection_mode,
        event_count: row.event_count
      }));

    res.json({
      db_job_id: firstRow.db_job_id,
      bullmq_job_id: firstRow.bullmq_job_id,
      status: firstRow.status,
      error_message: firstRow.error_message,
      original_filename: firstRow.original_filename,
      stored_filename: firstRow.stored_filename,
      warnings
    });
  } catch (error) {
    console.error("Failed to fetch warnings:", error);
    res.status(500).json({ error: "Failed to fetch warnings" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});