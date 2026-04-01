const requiredS3Vars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET",
];

function getStorageType() {
  return process.env.STORAGE_TYPE || "local";
}

function validateStorageConfig() {
  const storageType = getStorageType();

  if (!["local", "s3"].includes(storageType)) {
    throw new Error(
      `Invalid STORAGE_TYPE: ${storageType}. Use "local" or "s3".`
    );
  }

  if (storageType === "s3") {
    const missingVars = requiredS3Vars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
      throw new Error(
        `S3 storage is enabled, but these environment variables are missing: ${missingVars.join(", ")}`
      );
    }

    if (!process.env.AWS_S3_ENDPOINT) {
      console.warn(
        "Warning: AWS_S3_ENDPOINT is not set. This is okay for real AWS S3, but for MinIO/local testing you usually need it."
      );
    }
  }

  return {
    storageType,
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsS3Bucket: process.env.AWS_S3_BUCKET,
    awsS3Endpoint: process.env.AWS_S3_ENDPOINT,
  };
}

module.exports = {
  getStorageType,
  validateStorageConfig,
};