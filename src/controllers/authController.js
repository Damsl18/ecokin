const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const UserModel = require('../models/userModel');
const SessionModel = require('../models/sessionModel');
const { generateToken } = require('../utils/token');
const { COOKIE_NAME } = require('../middlewares/auth');

const SESSION_DURATION_DAYS = parseInt(process.env.SESSION_DURATION_DAYS || '7', 10);
const RESET_TOKEN_DURATION_HOURS = 1;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  };
}

function getResetFrontendBaseUrl() {
  const urls = [
    process.env.FRONTEND_USER_URL,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS && process.env.FRONTEND_URLS.split(',')[0],
  ].filter(Boolean);

  return (urls[0] || 'http://localhost:5502').trim().replace(/\/$/, '');
}

function getResetFrontendPath() {
  const configuredPath = process.env.FRONTEND_RESET_PASSWORD_PATH || '/reset-password.html';
  return configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`;
}

async function sendResetEmail(email, token) {
  const resetLink = `${getResetFrontendBaseUrl()}${getResetFrontendPath()}?token=${token}`;

  if (!process.env.SMTP_HOST) {
    // Mode dev : pas de SMTP configuré, on logue simplement le lien.
    console.log(`[DEV] Lien de réinitialisation pour ${email} : ${resetLink}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'EcoKin - Réinitialisation de votre mot de passe',
    html: `<p>Bonjour,</p>
           <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valable 1h) :</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  });
}

const AuthController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { email, password, nom, prenom, commune } = req.body;

      if (!email || !password || !nom || !prenom || !commune) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires (email, password, nom, prenom, commune).' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ email, hashedPassword, nom, prenom, commune });

      res.status(201).json({ message: 'Compte créé avec succès.', user });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Ce compte a été bloqué par un administrateur.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }

      const token = generateToken();
      const expirationDate = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
      await SessionModel.create(user.id, token, expirationDate);

      res.cookie(COOKIE_NAME, token, cookieOptions());
      res.json({
        message: 'Connexion réussie.',
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          commune: user.commune,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      if (req.sessionToken) {
        await SessionModel.deleteByToken(req.sessionToken);
      }
      res.clearCookie(COOKIE_NAME);
      res.json({ message: 'Déconnexion réussie.' });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email requis.' });
      }

      const user = await UserModel.findByEmail(email);
      // On répond toujours pareil, qu'il existe ou non (anti-énumération)
      if (user) {
        const token = generateToken();
        const expires = new Date(Date.now() + RESET_TOKEN_DURATION_HOURS * 60 * 60 * 1000);
        await UserModel.setResetToken(user.id, token, expires);
        await sendResetEmail(user.email, token);
      }

      res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
      }

      const user = await UserModel.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Token invalide ou expiré.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePassword(user.id, hashedPassword);
      await UserModel.clearResetToken(user.id);

      res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
