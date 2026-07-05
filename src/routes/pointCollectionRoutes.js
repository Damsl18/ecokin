const express = require('express');
const router = express.Router();
const PointCollectionController = require('../controllers/pointCollectionController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Public
router.get('/', PointCollectionController.listAll);
router.get('/:id', PointCollectionController.getOne);

// Admin
router.post('/', requireAuth, requireAdmin, PointCollectionController.create);
router.put('/:id', requireAuth, requireAdmin, PointCollectionController.update);
router.delete('/:id', requireAuth, requireAdmin, PointCollectionController.remove);

module.exports = router;
