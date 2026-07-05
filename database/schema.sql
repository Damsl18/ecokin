-- ============================================================
-- EcoKin - Schéma PostgreSQL corrigé
-- Version corrigée : 05/07/2026
-- Décisions importantes :
--   - Valeurs techniques sans accents pour éviter les erreurs CHECK :
--     articles.statut : en_attente | publie | rejete
--     signalements.statut : en_attente | valide | en_cours | traite | rejete
--   - Zones à risque ajoutées pour la carte admin/public.
--   - Les sessions restent serveur avec token opaque en cookie httpOnly.
-- ============================================================

-- ============ TABLE USERS ============
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN DEFAULT FALSE,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE SIGNALEMENTS ============
CREATE TABLE signalements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titre VARCHAR(255),
  description TEXT NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_path VARCHAR(500),
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'en_cours', 'traite', 'rejete')),
  motif_rejet TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_validation TIMESTAMP,
  validated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- ============ TABLE ARTICLES ============
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  categorie VARCHAR(100),
  cover_image_path VARCHAR(500),
  auteur_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'publie', 'rejete')),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_publication TIMESTAMP,
  validated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- ============ TABLE POINTS_COLLECTION ============
CREATE TABLE points_collection (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type_dechet VARCHAR(100),
  horaires VARCHAR(255),
  contact VARCHAR(20),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE ZONES_RISQUE ============
-- Représentation simple compatible Leaflet : une zone circulaire avec centre + rayon.
-- Si l'équipe veut des polygones plus tard, ajouter une colonne GeoJSON/PostGIS.
CREATE TABLE zones_risque (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  commune VARCHAR(100),
  niveau_risque VARCHAR(50) DEFAULT 'moyen' CHECK (niveau_risque IN ('faible', 'moyen', 'eleve', 'critique')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  rayon_m INT DEFAULT 100 CHECK (rayon_m > 0),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE SESSIONS ============
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration TIMESTAMP NOT NULL
);

-- ============ INDEX ============
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_signalements_user_id ON signalements(user_id);
CREATE INDEX idx_signalements_statut ON signalements(statut);
CREATE INDEX idx_articles_auteur_id ON articles(auteur_id);
CREATE INDEX idx_articles_statut ON articles(statut);
CREATE INDEX idx_points_collection_type ON points_collection(type_dechet);
CREATE INDEX idx_zones_risque_commune ON zones_risque(commune);
CREATE INDEX idx_zones_risque_niveau ON zones_risque(niveau_risque);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
