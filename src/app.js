const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_ADMIN_URL,
  process.env.FRONTEND_USER_URL,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PUBLIC_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requêtes serveur à serveur, Postman, curl, ou même-origin.
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origine CORS non autorisée : ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Fichiers uploadés servis statiquement (photos signalements, couvertures articles)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  allowed_origins: allowedOrigins,
}));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

app.use(errorHandler);

module.exports = app;
