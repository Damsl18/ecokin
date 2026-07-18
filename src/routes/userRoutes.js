const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Profil de l'utilisateur connecté
router.get('/me', requireAuth, UserController.getMe);
router.put('/me', requireAuth, UserController.updateMe);
router.put('/me/password', requireAuth, UserController.updateMyPassword);

// Admin uniquement
router.get('/', requireAuth, requireAdmin, UserController.listAll);
router.post('/', requireAuth, requireAdmin, UserController.createByAdmin);
router.get('/:id', requireAuth, requireAdmin, UserController.getOneAdmin);
router.put('/:id', requireAuth, requireAdmin, UserController.updateByAdmin);
router.patch('/:id/block', requireAuth, requireAdmin, UserController.toggleBlock);
router.delete('/:id', requireAuth, requireAdmin, UserController.remove);

module.exports = router;
