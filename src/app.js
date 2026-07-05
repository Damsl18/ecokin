const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // indispensable : autorise l'envoi/réception du cookie de session
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Fichiers uploadés servis statiquement (photos signalements, couvertures articles)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

app.use(errorHandler);

module.exports = app;
