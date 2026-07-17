const cloudinary = require('../config/cloudinary');

/**
 * Envoie un buffer image (fourni par multer en mémoire) vers Cloudinary.
 * Retourne l'URL sécurisée (https) à stocker en base — plus jamais un
 * chemin local, donc plus jamais perdue au redéploiement du serveur.
 *
 * @param {Express.Multer.File} file - req.file fourni par multer (memoryStorage)
 * @param {string} folder - sous-dossier Cloudinary ('ecokin/signalements' ou 'ecokin/articles')
 * @returns {Promise<string|null>} l'URL Cloudinary, ou null si aucun fichier
 */
function uploadImageBuffer(file, folder) {
  if (!file) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Optimisation automatique : limite la taille max et compresse
        // sans changement visible — utile pour les connexions mobiles.
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

module.exports = { uploadImageBuffer };
