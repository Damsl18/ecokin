const express = require('express');
const router = express.Router();
const SignalementController = require('../controllers/signalementController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { uploadSignalementPhoto } = require('../middlewares/upload');

// Public (carte) — défini AVANT /:id pour éviter les conflits de route
router.get('/public', SignalementController.listPublicForMap);

// Utilisateur connecté
router.post('/', requireAuth, uploadSignalementPhoto, SignalementController.create);
router.get('/me', requireAuth, SignalementController.listMine);
router.get('/:id', requireAuth, SignalementController.getOne);

// Admin
router.get('/', requireAuth, requireAdmin, SignalementController.listAll);
router.patch('/:id/statut', requireAuth, requireAdmin, SignalementController.updateStatut);
router.delete('/:id', requireAuth, requireAdmin, SignalementController.remove);

module.exports = router;
