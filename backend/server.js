const express = require("express");
const { movieQueue } = require("./queue");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend server running");
});

app.get("/test-job", async (req, res) => {
  try {
    const job = await movieQueue.add("process-movie", {
      moviePath: "../uploads/test.mp4"
    });

    res.json({
      message: "Test job added successfully",
      jobId: job.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add test job" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});