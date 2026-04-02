const express = require("express");
require("dotenv").config();

const uploadRoutes = require("./src/routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

const pool = require("./db");

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