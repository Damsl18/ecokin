const crypto = require('crypto');

/**
 * Génère un token opaque aléatoire (utilisé pour les sessions
 * et pour la réinitialisation de mot de passe).
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { generateToken };
