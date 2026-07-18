const UserModel = require('../models/userModel');
const SignalementModel = require('../models/signalementModel');
const ArticleModel = require('../models/articleModel');

const DashboardController = {
  // GET /api/dashboard/user  (widgets espace utilisateur)
  async userDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const [mesSignalements, mesArticles, articlesPublies, signalementsTraites] = await Promise.all([
        SignalementModel.findByUser(userId),
        ArticleModel.findByAuteur(userId),
        ArticleModel.countByStatutForAuteur(userId, 'publie'),
        SignalementModel.countByStatutForUser(userId, 'traite'),
      ]);

      res.json({
        widgets: {
          nombre_signalements: mesSignalements.length,
          nombre_articles: mesArticles.length,
          articles_publies: articlesPublies,
          signalements_traites: signalementsTraites,
        },
        derniers_signalements: mesSignalements.slice(0, 5),
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/dashboard/admin
  async adminDashboard(req, res, next) {
    try {
      const [
        totalUsers, totalSignalements, totalArticles,
        signalementsEnAttente, articlesEnAttente,
        nouveauxUtilisateurs7j, signalements7j, articlesPublies7j,
      ] = await Promise.all([
        UserModel.countAll(),
        SignalementModel.countAll(),
        ArticleModel.countAll(),
        SignalementModel.findAll({ statut: 'en_attente' }),
        ArticleModel.findAll({ statut: 'en_attente' }),
        UserModel.countCreatedSince(7),
        SignalementModel.countCreatedSince(7),
        ArticleModel.countPublishedSince(7),
      ]);

      res.json({
        widgets: {
          total_utilisateurs: totalUsers,
          total_signalements: totalSignalements,
          total_articles: totalArticles,
          signalements_en_attente: signalementsEnAttente.length,
          articles_en_attente: articlesEnAttente.length,
          nouveaux_utilisateurs_7j: nouveauxUtilisateurs7j,
          signalements_7j: signalements7j,
          articles_publies_7j: articlesPublies7j,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/stats/public  (page d'accueil, non authentifié)
  async publicStats(req, res, next) {
    try {
      const [totalUsers, signalementsTraites, articlesPublies] = await Promise.all([
        UserModel.countAll(),
        SignalementModel.countTraites(),
        ArticleModel.countPublishedTotal(),
      ]);

      res.json({
        citoyens_inscrits: totalUsers,
        signalements_traites: signalementsTraites,
        articles_publies: articlesPublies,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = DashboardController;
