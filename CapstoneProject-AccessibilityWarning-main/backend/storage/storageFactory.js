const LocalStorageProvider = require("./localStorage.provider");
const S3StorageProvider = require("./s3Storage.provider");

function getStorageProvider() {
  const type = process.env.STORAGE_TYPE || "local";

  if (type === "s3") {
    return new S3StorageProvider();
  }

  return new LocalStorageProvider();
}

module.exports = getStorageProvider;