const SignalementModel = require('../models/signalementModel');
const PointCollectionModel = require('../models/pointCollectionModel');
const ZoneRisqueModel = require('../models/zoneRisqueModel');
const { normalizeNiveauRisque, niveauRisqueMessage } = require('../utils/risque');

const MapController = {
  // GET /api/map/data?commune=&type_dechet=&niveau_risque=
  // Endpoint unique consommé par Leaflet : renvoie 3 collections de marqueurs/zones
  // déjà formatées (lat/lng en nombre, pas en string).
  async getMapData(req, res, next) {
    try {
      const { commune, type_dechet } = req.query;
      const niveau_risque = req.query.niveau_risque ? normalizeNiveauRisque(req.query.niveau_risque) : undefined;
      if (req.query.niveau_risque && !niveau_risque) {
        return res.status(400).json({ error: `Niveau de risque invalide. Valeurs possibles : ${niveauRisqueMessage()}.` });
      }

      const [signalements, points, zones] = await Promise.all([
        SignalementModel.findValidatedForMap({ commune }),
        PointCollectionModel.findAll({ typeDechet: type_dechet }),
        ZoneRisqueModel.findAll({ commune, niveauRisque: niveau_risque }),
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
          statut: s.statut,
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
        zones_risque: zones.map((z) => ({
          id: z.id,
          type: 'zone_risque',
          nom: z.nom,
          description: z.description,
          commune: z.commune,
          niveau_risque: z.niveau_risque,
          latitude: parseFloat(z.latitude),
          longitude: parseFloat(z.longitude),
          rayon_m: z.rayon_m,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = MapController;
