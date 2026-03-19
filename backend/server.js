// const express = require("express");
// const multer = require("multer");
// const { movieQueue } = require("./queue");
// const path = require("path");
// const fs = require("fs");

// const uploadsDir = path.join(__dirname, "..", "uploads");

// const app = express();
// const PORT = 3000;

// // Make sure uploads folder exists
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ storage });

// app.post("/upload", upload.single("movie"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No movie file uploaded" });
//     }

//     const filePath = req.file.path;

//     const jobData = {
//       jobId: null,
//       moviePath: filePath,
//       originalFileName: req.file.originalname,
//       storedFileName: req.file.filename,
//       uploadedAt: new Date().toISOString()
//     };

//     const job = await movieQueue.add("process-movie", jobData);

//     res.json({
//       message: "Movie uploaded and job created",
//       jobId: job.id,
//       file: {
//         originalName: req.file.originalname,
//         storedName: req.file.filename,
//         path: filePath
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require("express");
const uploadRoutes = require("./src/routes/uploadRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});