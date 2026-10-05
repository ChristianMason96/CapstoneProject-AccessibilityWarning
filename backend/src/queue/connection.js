require("dotenv").config();
const IORedis = require("ioredis");
const { Queue } = require("bullmq");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});
const movieQueue = new Queue("movie-processing", { connection });

module.exports = { movieQueue, connection };