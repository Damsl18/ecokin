const ArticleModel = require('../models/articleModel');

function buildCoverPath(file) {
  return file ? `/uploads/articles/${file.filename}` : null;
}

const STATUTS_VALIDES = ['en_attente', 'publié', 'rejeté'];

const ArticleController = {
  // POST /api/articles  (auth requis, image de couverture optionnelle)
  async create(req, res, next) {
    try {
      const { titre, contenu, categorie } = req.body;
      if (!titre || !contenu) {
        return res.status(400).json({ error: 'Champs requis : titre, contenu.' });
      }

      const article = await ArticleModel.create({
        auteurId: req.user.id,
        titre,
        contenu,
        categorie,
        coverImagePath: buildCoverPath(req.file),
      });

      res.status(201).json({
        message: 'Article soumis pour validation. Il sera vérifié par un administrateur avant publication.',
        article,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/articles/me
  async listMine(req, res, next) {
    try {
      const articles = await ArticleModel.findByAuteur(req.user.id);
      res.json({ articles });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/articles/:id  (auteur, admin, ou public si publié)
  async getOne(req, res, next) {
    try {
      const article = await ArticleModel.findById(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article introuvable.' });

      const isOwner = req.user && article.auteur_id === req.user.id;
      const isAdmin = req.user && req.user.role === 'admin';
      if (article.statut !== 'publié' && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Cet article n\'est pas encore publié.' });
      }

      res.json({ article });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/articles/:id  (auteur uniquement, si en_attente)
  async update(req, res, next) {
    try {
      const existing = await ArticleModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Article introuvable.' });
      if (existing.auteur_id !== req.user.id) {
        return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres articles.' });
      }
      if (existing.statut !== 'en_attente') {
        return res.status(400).json({ error: 'Seuls les articles en attente peuvent être modifiés.' });
      }

      const { titre, contenu, categorie } = req.body;
      if (!titre || !contenu) {
        return res.status(400).json({ error: 'Champs requis : titre, contenu.' });
      }

      const article = await ArticleModel.update(req.params.id, {
        titre,
        contenu,
        categorie,
        coverImagePath: buildCoverPath(req.file),
      });

      res.json({ message: 'Article mis à jour.', article });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/articles/:id  (auteur si en_attente, ou admin toujours)
  async remove(req, res, next) {
    try {
      const existing = await ArticleModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Article introuvable.' });

      const isAdmin = req.user.role === 'admin';
      const isOwnerPending = existing.auteur_id === req.user.id && existing.statut === 'en_attente';
      if (!isAdmin && !isOwnerPending) {
        return res.status(403).json({ error: 'Suppression non autorisée.' });
      }

      await ArticleModel.delete(req.params.id);
      res.json({ message: 'Article supprimé.' });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/articles/public?search=&page=&limit=
  async listPublic(req, res, next) {
    try {
      const { search } = req.query;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '9', 10);

      const [articles, total] = await Promise.all([
        ArticleModel.findPublished({ search, page, limit }),
        ArticleModel.countPublished({ search }),
      ]);

      res.json({
        articles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  // ---- Admin ----

  // GET /api/articles?statut=
  async listAll(req, res, next) {
    try {
      const { statut } = req.query;
      const articles = await ArticleModel.findAll({ statut });
      res.json({ articles });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/articles/:id/statut
  async updateStatut(req, res, next) {
    try {
      const { statut } = req.body;
      if (!STATUTS_VALIDES.includes(statut)) {
        return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${STATUTS_VALIDES.join(', ')}.` });
      }
      const article = await ArticleModel.updateStatut(req.params.id, {
        statut,
        validatedBy: req.user.id,
      });
      if (!article) return res.status(404).json({ error: 'Article introuvable.' });
      res.json({ message: 'Statut mis à jour.', article });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ArticleController;
