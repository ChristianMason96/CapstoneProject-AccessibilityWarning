const express = require("express");
const multer = require("multer");
const { uploadMovie } = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/upload", upload.single("movie"), uploadMovie);

module.exports = router;