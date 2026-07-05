const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = path.join(__dirname, `../../uploads/${subfolder}`);
      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const uniqueName = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueName}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Format d\'image non supporté. Formats acceptés : JPG, PNG, WEBP.'));
  }
  cb(null, true);
}

const uploadSignalementPhoto = multer({
  storage: makeStorage('signalements'),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('photo');

const uploadArticleCover = multer({
  storage: makeStorage('articles'),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('cover_image');

module.exports = { uploadSignalementPhoto, uploadArticleCover };
