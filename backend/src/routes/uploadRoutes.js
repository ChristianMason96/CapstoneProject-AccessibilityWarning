const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadMovie } = require("../controllers/uploadController");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads");

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

router.post("/upload", upload.single("movie"), uploadMovie);

module.exports = router;