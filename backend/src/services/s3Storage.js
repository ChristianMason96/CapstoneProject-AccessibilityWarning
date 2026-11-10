
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1"
});

async function uploadToS3(filePath, fileName, contentType) {
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const key = `movies/${fileName}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType || "application/octet-stream"
    },
    queueSize: 2,
    partSize: 5 * 1024 * 1024,
    leavePartsOnError: false
  });

  await upload.done();

  return {
    provider: "s3",
    bucket: bucketName,
    key
  };
}

async function deleteFromS3(bucket, key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}

module.exports = { uploadToS3, deleteFromS3 };
