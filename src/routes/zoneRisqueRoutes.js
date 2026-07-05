const express = require('express');
const router = express.Router();
const ZoneRisqueController = require('../controllers/zoneRisqueController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Public
router.get('/', ZoneRisqueController.listAll);
router.get('/:id', ZoneRisqueController.getOne);

// Admin
router.post('/', requireAuth, requireAdmin, ZoneRisqueController.create);
router.put('/:id', requireAuth, requireAdmin, ZoneRisqueController.update);
router.delete('/:id', requireAuth, requireAdmin, ZoneRisqueController.remove);

module.exports = router;
