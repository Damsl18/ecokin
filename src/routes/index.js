const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/dashboardController');

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/signalements', require('./signalementRoutes'));
router.use('/articles', require('./articleRoutes'));
router.use('/points-collection', require('./pointCollectionRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/map', require('./mapRoutes'));

// Stats publiques pour la landing page
router.get('/stats/public', DashboardController.publicStats);

module.exports = router;
