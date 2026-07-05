const SessionModel = require('../models/sessionModel');

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ecokin_session';

/**
 * Vérifie que la requête porte une session valide (cookie -> token
 * -> ligne en base non expirée). Attache req.user si tout est bon.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
    }

    const session = await SessionModel.findByToken(token);
    if (!session) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Session invalide ou expirée. Veuillez vous reconnecter.' });
    }

    if (session.is_blocked) {
      return res.status(403).json({ error: 'Ce compte a été bloqué par un administrateur.' });
    }

    req.user = {
      id: session.user_id,
      nom: session.nom,
      prenom: session.prenom,
      email: session.email,
      commune: session.commune,
      role: session.role,
    };
    req.sessionToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * À utiliser APRÈS requireAuth. Réserve la route au rôle admin.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, COOKIE_NAME };
