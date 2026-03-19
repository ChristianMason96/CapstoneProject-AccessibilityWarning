const { Queue } = require("bullmq");
const { connection } = require("./connection");

const movieQueue = new Queue("movie-processing", { connection });

module.exports = { movieQueue };