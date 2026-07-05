const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

router.get('/user', requireAuth, DashboardController.userDashboard);
router.get('/admin', requireAuth, requireAdmin, DashboardController.adminDashboard);

module.exports = router;
