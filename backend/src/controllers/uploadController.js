const { movieQueue } = require("../queue/movieQueue");
const { uploadFile } = require("../services/storageService");
const pool = require("../../db");

const uploadMovie = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No movie file uploaded" });
    }

    const fileReference = await uploadFile(req.file);

    await client.query("BEGIN");

    const storedFileName = fileReference.fileName || fileReference.storedName;
    const originalFileName = fileReference.originalName;

    const storedLocation =
      fileReference.provider === "s3"
        ? fileReference.key
        : fileReference.path;

    const mediaResult = await client.query(
      `
      INSERT INTO media_files (original_filename, stored_filename, file_path)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [originalFileName, storedFileName, storedLocation]
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
      fileReference,
      uploadedAt: new Date().toISOString(),
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
      file: fileReference,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Upload failed:", error);
    res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = { uploadMovie };