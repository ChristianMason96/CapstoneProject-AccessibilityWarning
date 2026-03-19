const { movieQueue } = require("../queue/movieQueue");

const uploadMovie = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No movie file uploaded" });
    }

    const filePath = req.file.path;

    const jobData = {
      jobId: null,
      moviePath: filePath,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      uploadedAt: new Date().toISOString()
    };

    const job = await movieQueue.add("process-movie", jobData);

    res.json({
      message: "Movie uploaded and job created",
      jobId: job.id,
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: filePath
      }
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = { uploadMovie };