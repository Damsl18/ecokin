const SignalementModel = require('../models/signalementModel');
const SignalementLectureModel = require('../models/signalementLectureModel');
const { normalizeSignalementStatut, signalementStatusMessage } = require('../utils/status');

function buildPhotoPath(file) {
  return file ? `/uploads/signalements/${file.filename}` : null;
}

function deriveTitre(description) {
  const clean = description.trim().replace(/\s+/g, ' ');
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean;
}

const SignalementController = {
  // POST /api/signalements  (auth requis, photo optionnelle via multipart/form-data)
  async create(req, res, next) {
    try {
      const { description, adresse, latitude, longitude, titre } = req.body;

      if (!description || !adresse || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: 'Champs requis : description, adresse, latitude, longitude (sélectionnés sur la carte).',
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ error: 'Latitude/longitude invalides.' });
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Latitude ou longitude hors limites.' });
      }

      const signalement = await SignalementModel.create({
        userId: req.user.id,
        titre: titre && titre.trim() ? titre.trim() : deriveTitre(description),
        description: description.trim(),
        adresse: adresse.trim(),
        latitude: lat,
        longitude: lng,
        photoPath: buildPhotoPath(req.file),
      });

      res.status(201).json({ message: 'Signalement envoyé avec succès.', signalement });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/signalements/me?statut=
  async listMine(req, res, next) {
    try {
      const statut = req.query.statut ? normalizeSignalementStatut(req.query.statut) : undefined;
      if (req.query.statut && !statut) {
        return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${signalementStatusMessage()}.` });
      }

      const signalements = await SignalementModel.findByUser(req.user.id, { statut });
      res.json({ signalements });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/signalements/:id  (propriétaire ou admin)
  async getOne(req, res, next) {
    try {
      const signalement = await SignalementModel.findById(req.params.id);
      if (!signalement) return res.status(404).json({ error: 'Signalement introuvable.' });

      if (signalement.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès non autorisé à ce signalement.' });
      }
      res.json({ signalement });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/signalements/public  (carte publique — signalements visibles uniquement)
  async listPublicForMap(req, res, next) {
    try {
      const { commune } = req.query;
      const signalements = await SignalementModel.findValidatedForMap({ commune });
      res.json({ signalements });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/signalements/lues  (auth requis — IDs des signalements déjà lus par l'utilisateur)
  async listRead(req, res, next) {
    try {
      const ids = await SignalementLectureModel.listReadIdsForUser(req.user.id);
      res.json({ signalement_ids: ids });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/signalements/:id/lu  (auth requis — marquage définitif, pas de démarquage)
  async markAsRead(req, res, next) {
    try {
      const signalement = await SignalementModel.findById(req.params.id);
      if (!signalement) return res.status(404).json({ error: 'Signalement introuvable.' });

      const lecture = await SignalementLectureModel.markAsRead(req.user.id, req.params.id);
      res.json({ message: 'Signalement marqué comme lu.', lecture });
    } catch (err) {
      next(err);
    }
  },

  // ---- Admin ----

  // GET /api/signalements?statut=&commune=
  async listAll(req, res, next) {
    try {
      const statut = req.query.statut ? normalizeSignalementStatut(req.query.statut) : undefined;
      if (req.query.statut && !statut) {
        return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${signalementStatusMessage()}.` });
      }

      const { commune } = req.query;
      const signalements = await SignalementModel.findAll({ statut, commune });
      res.json({ signalements });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/signalements/:id/statut
  async updateStatut(req, res, next) {
    try {
      const statut = normalizeSignalementStatut(req.body.statut);
      const { motif_rejet } = req.body;

      if (!statut) {
        return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${signalementStatusMessage()}.` });
      }
      if (statut === 'rejete' && !motif_rejet) {
        return res.status(400).json({ error: 'Un motif de rejet est requis pour rejeter un signalement.' });
      }

      const signalement = await SignalementModel.updateStatut(req.params.id, {
        statut,
        motifRejet: statut === 'rejete' ? motif_rejet : null,
        validatedBy: req.user.id,
      });
      if (!signalement) return res.status(404).json({ error: 'Signalement introuvable.' });

      res.json({ message: 'Statut mis à jour.', signalement });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/signalements/:id
  async remove(req, res, next) {
    try {
      await SignalementModel.delete(req.params.id);
      res.json({ message: 'Signalement supprimé.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = SignalementController;
