const PointCollectionModel = require('../models/pointCollectionModel');

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
      const { nom, adresse, latitude, longitude, type_dechet, horaires, contact } = req.body;
      if (!nom || !adresse || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Champs requis : nom, adresse, latitude, longitude.' });
      }
      const point = await PointCollectionModel.create({
        nom, adresse,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        typeDechet: type_dechet, horaires, contact,
      });
      res.status(201).json({ message: 'Point de collecte créé.', point });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/points-collection/:id  (admin)
  async update(req, res, next) {
    try {
      const { nom, adresse, latitude, longitude, type_dechet, horaires, contact } = req.body;
      const point = await PointCollectionModel.update(req.params.id, {
        nom, adresse,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        typeDechet: type_dechet, horaires, contact,
      });
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
