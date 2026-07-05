const SignalementModel = require('../models/signalementModel');
const PointCollectionModel = require('../models/pointCollectionModel');

const MapController = {
  // GET /api/map/data?commune=&type_dechet=
  // Endpoint unique consommé par Leaflet : renvoie 2 collections de
  // marqueurs déjà formatées (lat/lng en nombre, pas en string).
  async getMapData(req, res, next) {
    try {
      const { commune, type_dechet } = req.query;

      const [signalements, points] = await Promise.all([
        SignalementModel.findValidatedForMap({ commune }),
        PointCollectionModel.findAll({ typeDechet: type_dechet }),
      ]);

      res.json({
        signalements: signalements.map((s) => ({
          id: s.id,
          type: 'signalement',
          titre: s.titre,
          description: s.description,
          adresse: s.adresse,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          photo_path: s.photo_path,
          commune: s.user_commune,
          date: s.date_creation,
        })),
        points_collection: points.map((p) => ({
          id: p.id,
          type: 'point_collection',
          nom: p.nom,
          adresse: p.adresse,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          type_dechet: p.type_dechet,
          horaires: p.horaires,
          contact: p.contact,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = MapController;
