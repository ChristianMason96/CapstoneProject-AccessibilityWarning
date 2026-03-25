// localStorage.provider.js
const fs = require('fs');
const path = require('path');
const StorageProvider = require('./storage.interface');

class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.uploadPath = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

 async upload(file) {
  // generate movie ID (for now simple)
  const movieId = `movie_${Date.now()}`;

  // clean file name (lowercase + underscores)
  const cleanName = file.originalname
    .toLowerCase()
    .replace(/\s+/g, "_");

  const movieFolder = path.join(this.uploadPath, movieId, "original");

  // create folders
  if (!fs.existsSync(movieFolder)) {
    fs.mkdirSync(movieFolder, { recursive: true });
  }

  const filePath = path.join(movieFolder, cleanName);

  await fs.promises.writeFile(filePath, file.buffer);

  return {
    provider: 'local',
    path: filePath,
    fileName: cleanName,
    movieId: movieId,
    originalName: file.originalname
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