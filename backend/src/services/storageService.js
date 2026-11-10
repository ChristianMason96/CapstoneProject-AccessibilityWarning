
const fs = require("fs");
const { pipeline } = require("stream/promises");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1"
});

async function getFile(fileReference, destinationPath) {
  if (fileReference.provider === "local") {
    return fileReference.path;
  }

  if (fileReference.provider === "s3") {
    if (!destinationPath) {
      throw new Error("Destination path is required for S3 downloads");
    }

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: fileReference.bucket,
        Key: fileReference.key
      })
    );

    await pipeline(
      response.Body,
      fs.createWriteStream(destinationPath)
    );

    return destinationPath;
  }

  throw new Error("Unsupported storage provider");
}

module.exports = { getFile };
