const multer = require('multer');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Format d\'image non supporté. Formats acceptés : JPG, PNG, WEBP.'));
  }
  cb(null, true);
}

// memoryStorage : le fichier reste en RAM (req.file.buffer) le temps de la requête,
// puis part vers Cloudinary. Rien n'est jamais écrit sur le disque du serveur —
// donc rien n'est perdu au redémarrage/redéploiement.
const storage = multer.memoryStorage();

const uploadSignalementPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('photo');

const uploadArticleCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('cover_image');

module.exports = { uploadSignalementPhoto, uploadArticleCover };
