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