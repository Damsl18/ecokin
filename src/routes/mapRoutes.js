const express = require('express');
const router = express.Router();
const MapController = require('../controllers/mapController');

router.get('/data', MapController.getMapData);

module.exports = router;
