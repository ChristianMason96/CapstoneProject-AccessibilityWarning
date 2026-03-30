const express = require("express");
const router = express.Router();
const pool = require("../db");

// INSERT result
router.post("/results", async (req, res) => {
  try {
    const { jobId, type, start, end } = req.body;

    const result = await pool.query(
      "INSERT INTO warning_segments (job_id, type, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *",
      [jobId, type, start, end]
    );

    res.json({
      message: "Result stored",
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// GET results
router.get("/warnings/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      "SELECT * FROM warning_segments WHERE job_id = $1",
      [jobId]
    );

    res.json({ warnings: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

module.exports = router;