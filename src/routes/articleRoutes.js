const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/articleController');
const { requireAuth, requireAdmin, COOKIE_NAME } = require('../middlewares/auth');
const { uploadArticleCover } = require('../middlewares/upload');
const SessionModel = require('../models/sessionModel');

// Middleware d'auth optionnelle : on tente de récupérer req.user si un cookie
// de session valide est présent, sans bloquer si absent/expiré.
// Utile pour /:id qui doit rester accessible au public si l'article est publié.
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return next();

    const session = await SessionModel.findByToken(token);
    if (!session || session.is_blocked) return next();

    req.user = {
      id: session.user_id,
      nom: session.nom,
      prenom: session.prenom,
      email: session.email,
      commune: session.commune,
      role: session.role,
    };
    req.sessionToken = token;
    return next();
  } catch (err) {
    return next();
  }
}

// Public — défini AVANT /:id
router.get('/public', ArticleController.listPublic);

// Utilisateur connecté
router.post('/', requireAuth, uploadArticleCover, ArticleController.create);
router.get('/me', requireAuth, ArticleController.listMine);
router.put('/:id', requireAuth, uploadArticleCover, ArticleController.update);
router.delete('/:id', requireAuth, ArticleController.remove);

// Consultable par tous si publié, sinon par auteur/admin (auth optionnelle)
router.get('/:id', optionalAuth, ArticleController.getOne);

// Admin
router.get('/', requireAuth, requireAdmin, ArticleController.listAll);
router.patch('/:id/statut', requireAuth, requireAdmin, ArticleController.updateStatut);

module.exports = router;
