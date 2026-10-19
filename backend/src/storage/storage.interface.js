// storage.interface.js
class StorageProvider {
  async upload(file) {
    throw new Error("Not implemented");
  }

  async get(filePath) {
    throw new Error("Not implemented");
  }

  async delete(filePath) {
    throw new Error("Not implemented");
  }
}

module.exports = StorageProvider;