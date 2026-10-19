const getStorageProvider = require("../storage/storageFactory");

async function uploadFile(file) {
  const storageProvider = getStorageProvider();
  return await storageProvider.upload(file);
}

module.exports = { uploadFile };

async function getFile(fileReference) {
  const storageProvider = getStorageProvider();

  if (fileReference.provider === "s3") {
    return await storageProvider.get(fileReference.key);
  }

  return await storageProvider.get(fileReference.path);
}

async function deleteFile(fileReference) {
  const storageProvider = getStorageProvider();

  if (fileReference.provider === "s3") {
    return await storageProvider.delete(fileReference.key);
  }

  return await storageProvider.delete(fileReference.path);
}

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};