const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Erreur d'upload : ${err.message}` });
  }

  if (err.message && err.message.includes('Origine CORS non autorisée')) {
    return res.status(403).json({
      error: err.message,
      hint: 'Ajoutez cette origine dans FRONTEND_URLS ou FRONTEND_URL dans le fichier .env puis redémarrez le serveur.',
    });
  }

  if (err.message && err.message.includes('non supporté')) {
    return res.status(400).json({ error: err.message });
  }

  // Violation de contrainte unique PostgreSQL (ex : email déjà utilisé)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Cette valeur existe déjà (conflit d\'unicité).' });
  }

  // Violation CHECK PostgreSQL : très utile quand un statut côté code ne correspond pas à la DB.
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Valeur refusée par une contrainte de la base de données.',
      constraint: err.constraint,
      hint: 'Vérifiez que vous avez exécuté la dernière migration SQL et que les valeurs envoyées par le front correspondent au backend.',
    });
  }

  // Violation de clé étrangère PostgreSQL.
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide vers une ressource inexistante.' });
  }

  res.status(err.status || 500).json({
    error: err.publicMessage || 'Une erreur interne est survenue.',
  });
}

module.exports = errorHandler;
