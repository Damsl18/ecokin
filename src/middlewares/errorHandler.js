const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Erreur d'upload : ${err.message}` });
  }

  if (err.message && err.message.includes('non supporté')) {
    return res.status(400).json({ error: err.message });
  }

  // Violation de contrainte unique PostgreSQL (ex : email déjà utilisé)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Cette valeur existe déjà (conflit d\'unicité).' });
  }

  res.status(err.status || 500).json({
    error: err.publicMessage || 'Une erreur interne est survenue.',
  });
}

module.exports = errorHandler;
