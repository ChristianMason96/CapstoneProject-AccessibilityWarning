const express = require("express");
const multer = require("multer");
const { movieQueue } = require("./queue");

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload", upload.single("movie"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const job = await movieQueue.add("process-movie", {
      moviePath: filePath
    });

    res.json({
      message: "Movie uploaded and job created",
      jobId: job.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});