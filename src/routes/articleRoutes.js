const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/articleController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { uploadArticleCover } = require('../middlewares/upload');

// Middleware d'auth optionnelle : on tente de récupérer req.user si un
// cookie de session valide est présent, sans bloquer si absent
// (utile pour /:id qui doit rester accessible au public si publié).
const { requireAuth: strictAuth } = require('../middlewares/auth');
async function optionalAuth(req, res, next) {
  if (!req.cookies[require('../middlewares/auth').COOKIE_NAME]) return next();
  return strictAuth(req, res, next);
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
