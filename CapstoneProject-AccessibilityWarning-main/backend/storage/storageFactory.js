const LocalStorageProvider = require('./localStorage.provider');
// const S3StorageProvider = require('./s3Storage.provider');

function getStorageProvider() {
  const type = process.env.STORAGE_TYPE;

  if (type === 's3') {
    // return new S3StorageProvider();
    throw new Error('S3 storage provider not implemented yet');
  }

  return new LocalStorageProvider();
}

module.exports = getStorageProvider;