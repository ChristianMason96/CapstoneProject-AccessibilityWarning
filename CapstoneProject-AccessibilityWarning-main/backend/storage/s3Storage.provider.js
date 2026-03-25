const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const StorageProvider = require("./storage.interface");

class S3StorageProvider extends StorageProvider {
  constructor() {
    super();

    const config = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT;
      config.forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === "true";
    }

    this.bucket = process.env.AWS_S3_BUCKET;
    this.s3 = new S3Client(config);
  }

  async upload(file) {
    const movieId = `movie_${Date.now()}`;

    const cleanName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "_");

    const key = `uploads/${movieId}/original/${cleanName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || "application/octet-stream",
      })
    );

    return {
      provider: "s3",
      bucket: this.bucket,
      key: key,
      fileName: cleanName,
      movieId: movieId,
      originalName: file.originalname,
    };
  }

  async get(fileKey) {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      })
    );

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(fileKey) {
    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      })
    );
  }
}

module.exports = S3StorageProvider;