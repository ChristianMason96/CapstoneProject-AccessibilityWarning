require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { movieQueue } = require("./queue");
const getStorageProvider = require("./storage/storageFactory");

const app = express();
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("movie"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const storageProvider = getStorageProvider();
    const savedFile = await storageProvider.upload(req.file);

    const job = await movieQueue.add("process-movie", {
      fileReference: savedFile,
      uploadedAt: new Date().toISOString()
    });

    res.json({
      message: "Movie uploaded and job created",
      jobId: job.id,
      file: savedFile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});