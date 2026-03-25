// localStorage.provider.js
const fs = require('fs');
const path = require('path');
const StorageProvider = require('./storage.interface');

class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.uploadPath = path.join(__dirname, '../../uploads');

    // Create folder if not exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(file) {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      path: filePath,
      fileName: fileName
    };
  }

  async get(filePath) {
    return fs.promises.readFile(filePath);
  }

  async delete(filePath) {
    return fs.promises.unlink(filePath);
  }
}

module.exports = LocalStorageProvider;