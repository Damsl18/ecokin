const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

const UserController = {
  // GET /api/users/me
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/users/me
  async updateMe(req, res, next) {
    try {
      const { nom, prenom, email, commune } = req.body;
      if (!nom || !prenom || !email || !commune) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
      }
      const user = await UserModel.updateProfile(req.user.id, { nom, prenom, email, commune });
      res.json({ message: 'Profil mis à jour.', user });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/users/me/password
  async updateMyPassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }

      const fullUser = await UserModel.findByEmail(req.user.email);
      const match = await bcrypt.compare(currentPassword, fullUser.password);
      if (!match) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePassword(req.user.id, hashedPassword);
      res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (err) {
      next(err);
    }
  },

  // ---- Routes admin ----

  // GET /api/users
  async listAll(req, res, next) {
    try {
      const users = await UserModel.findAll();
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/users/:id/block
  async toggleBlock(req, res, next) {
    try {
      const { id } = req.params;
      const { blocked } = req.body; // true/false
      if (typeof blocked !== 'boolean') {
        return res.status(400).json({ error: 'Le champ "blocked" (booléen) est requis.' });
      }
      const user = await UserModel.setBlocked(id, blocked);
      if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
      res.json({ message: `Utilisateur ${blocked ? 'bloqué' : 'débloqué'}.`, user });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/users/:id
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte admin ici.' });
      }
      await UserModel.delete(id);
      res.json({ message: 'Utilisateur supprimé.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
