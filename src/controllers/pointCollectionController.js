const PointCollectionModel = require('../models/pointCollectionModel');

function validateCoordinates(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function validatePayload(req, res) {
  const { nom, adresse, latitude, longitude, type_dechet, horaires, contact } = req.body;

  if (!nom || !adresse || latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Champs requis : nom, adresse, latitude, longitude.' });
    return null;
  }

  const coords = validateCoordinates(latitude, longitude);
  if (!coords) {
    res.status(400).json({ error: 'Latitude/longitude invalides.' });
    return null;
  }

  return {
    nom: nom.trim(),
    adresse: adresse.trim(),
    latitude: coords.lat,
    longitude: coords.lng,
    typeDechet: type_dechet || null,
    horaires: horaires || null,
    contact: contact || null,
  };
}

const PointCollectionController = {
  // GET /api/points-collection?type_dechet=  (public)
  async listAll(req, res, next) {
    try {
      const { type_dechet } = req.query;
      const points = await PointCollectionModel.findAll({ typeDechet: type_dechet });
      res.json({ points });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/points-collection/:id
  async getOne(req, res, next) {
    try {
      const point = await PointCollectionModel.findById(req.params.id);
      if (!point) return res.status(404).json({ error: 'Point de collecte introuvable.' });
      res.json({ point });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/points-collection  (admin)
  async create(req, res, next) {
    try {
      const payload = validatePayload(req, res);
      if (!payload) return;

      const point = await PointCollectionModel.create(payload);
      res.status(201).json({ message: 'Point de collecte créé.', point });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/points-collection/:id  (admin)
  async update(req, res, next) {
    try {
      const payload = validatePayload(req, res);
      if (!payload) return;

      const point = await PointCollectionModel.update(req.params.id, payload);
      if (!point) return res.status(404).json({ error: 'Point de collecte introuvable.' });
      res.json({ message: 'Point de collecte mis à jour.', point });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/points-collection/:id  (admin)
  async remove(req, res, next) {
    try {
      await PointCollectionModel.delete(req.params.id);
      res.json({ message: 'Point de collecte supprimé.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = PointCollectionController;
