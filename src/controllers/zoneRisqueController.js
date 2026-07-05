const ZoneRisqueModel = require('../models/zoneRisqueModel');
const { normalizeNiveauRisque, niveauRisqueMessage } = require('../utils/risque');

function validateCoordinates(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function validatePayload(req, res) {
  const { nom, description, commune, niveau_risque, latitude, longitude, rayon_m } = req.body;

  if (!nom || latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Champs requis : nom, latitude, longitude.' });
    return null;
  }

  const coords = validateCoordinates(latitude, longitude);
  if (!coords) {
    res.status(400).json({ error: 'Latitude/longitude invalides.' });
    return null;
  }

  const niveauRisque = normalizeNiveauRisque(niveau_risque || 'moyen');
  if (!niveauRisque) {
    res.status(400).json({ error: `Niveau de risque invalide. Valeurs possibles : ${niveauRisqueMessage()}.` });
    return null;
  }

  const rayonM = rayon_m === undefined || rayon_m === '' ? 100 : parseInt(rayon_m, 10);
  if (Number.isNaN(rayonM) || rayonM <= 0) {
    res.status(400).json({ error: 'Le rayon doit être un nombre positif en mètres.' });
    return null;
  }

  return {
    nom: nom.trim(),
    description,
    commune,
    niveauRisque,
    latitude: coords.lat,
    longitude: coords.lng,
    rayonM,
  };
}

const ZoneRisqueController = {
  // GET /api/zones-risque?commune=&niveau_risque=  (public)
  async listAll(req, res, next) {
    try {
      const niveauRisque = req.query.niveau_risque ? normalizeNiveauRisque(req.query.niveau_risque) : undefined;
      if (req.query.niveau_risque && !niveauRisque) {
        return res.status(400).json({ error: `Niveau de risque invalide. Valeurs possibles : ${niveauRisqueMessage()}.` });
      }

      const zones = await ZoneRisqueModel.findAll({
        commune: req.query.commune,
        niveauRisque,
      });
      res.json({ zones });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/zones-risque/:id
  async getOne(req, res, next) {
    try {
      const zone = await ZoneRisqueModel.findById(req.params.id);
      if (!zone) return res.status(404).json({ error: 'Zone à risque introuvable.' });
      res.json({ zone });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/zones-risque  (admin)
  async create(req, res, next) {
    try {
      const payload = validatePayload(req, res);
      if (!payload) return;

      const zone = await ZoneRisqueModel.create(payload);
      res.status(201).json({ message: 'Zone à risque créée.', zone });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/zones-risque/:id  (admin)
  async update(req, res, next) {
    try {
      const payload = validatePayload(req, res);
      if (!payload) return;

      const zone = await ZoneRisqueModel.update(req.params.id, payload);
      if (!zone) return res.status(404).json({ error: 'Zone à risque introuvable.' });
      res.json({ message: 'Zone à risque mise à jour.', zone });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/zones-risque/:id  (admin)
  async remove(req, res, next) {
    try {
      await ZoneRisqueModel.delete(req.params.id);
      res.json({ message: 'Zone à risque supprimée.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ZoneRisqueController;
