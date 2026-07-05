-- ============================================================
-- EcoKin - Schéma PostgreSQL
-- Corrigé suite aux décisions du 04/07/2026 :
--   - Table `acteurs` supprimée (jugée inutile par l'équipe)
--   - Table `sessions` conservée et utilisée réellement (sessions
--     serveur avec token en cookie, PAS de JWT)
--   - Ajouts sur `users` : reset_token / reset_token_expires
--     (mot de passe oublié) et is_blocked (gestion admin des comptes)
--   - `signalements.titre` rendu NULLABLE : le formulaire "Signaler
--     un déchet" ne collecte pas de titre explicite (voir F2). Le
--     backend génère un titre court à partir de la description si
--     absent. À confirmer avec l'équipe front si un champ titre doit
--     être ajouté au formulaire.
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
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validé', 'rejeté')),
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
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'publié', 'rejeté')),
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

-- ============ TABLE SESSIONS ============
-- Utilisée activement : un token opaque est généré à la connexion,
-- stocké ici, et posé en cookie httpOnly côté client.
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
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
