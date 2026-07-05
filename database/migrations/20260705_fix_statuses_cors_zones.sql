-- ============================================================
-- Migration corrective EcoKin - 05/07/2026
-- À exécuter sur une base existante :
--   psql -d ecokin -f database/migrations/20260705_fix_statuses_cors_zones.sql
-- ============================================================

BEGIN;

-- ---------- ARTICLES : statuts techniques sans accents ----------
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_statut_check;

UPDATE articles
SET statut = CASE
  WHEN statut IN ('publié', 'publie', 'publiée', 'publiee') THEN 'publie'
  WHEN statut IN ('rejeté', 'rejete', 'rejetée', 'rejetee') THEN 'rejete'
  WHEN statut IN ('en_attente', 'attente') THEN 'en_attente'
  ELSE 'en_attente'
END;

ALTER TABLE articles ALTER COLUMN statut SET DEFAULT 'en_attente';
ALTER TABLE articles
  ADD CONSTRAINT articles_statut_check
  CHECK (statut IN ('en_attente', 'publie', 'rejete'));

UPDATE articles
SET date_publication = CASE WHEN statut = 'publie' THEN COALESCE(date_publication, NOW()) ELSE NULL END;

-- ---------- SIGNALEMENTS : workflow complet ----------
ALTER TABLE signalements DROP CONSTRAINT IF EXISTS signalements_statut_check;

UPDATE signalements
SET statut = CASE
  WHEN statut IN ('validé', 'valide', 'validée', 'validee') THEN 'valide'
  WHEN statut IN ('en_cours', 'en cours', 'traitement') THEN 'en_cours'
  WHEN statut IN ('traité', 'traite', 'traitée', 'traitee') THEN 'traite'
  WHEN statut IN ('rejeté', 'rejete', 'rejetée', 'rejetee') THEN 'rejete'
  WHEN statut IN ('en_attente', 'attente') THEN 'en_attente'
  ELSE 'en_attente'
END;

ALTER TABLE signalements ALTER COLUMN statut SET DEFAULT 'en_attente';
ALTER TABLE signalements
  ADD CONSTRAINT signalements_statut_check
  CHECK (statut IN ('en_attente', 'valide', 'en_cours', 'traite', 'rejete'));

UPDATE signalements
SET date_validation = CASE WHEN statut = 'en_attente' THEN NULL ELSE COALESCE(date_validation, NOW()) END;

-- ---------- ZONES À RISQUE ----------
CREATE TABLE IF NOT EXISTS zones_risque (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  commune VARCHAR(100),
  niveau_risque VARCHAR(50) DEFAULT 'moyen',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  rayon_m INT DEFAULT 100,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE zones_risque DROP CONSTRAINT IF EXISTS zones_risque_niveau_risque_check;
ALTER TABLE zones_risque DROP CONSTRAINT IF EXISTS zones_risque_rayon_m_check;

UPDATE zones_risque
SET niveau_risque = CASE
  WHEN niveau_risque IN ('faible', 'bas') THEN 'faible'
  WHEN niveau_risque IN ('moyen', 'modéré', 'modere') THEN 'moyen'
  WHEN niveau_risque IN ('eleve', 'élevé', 'haut', 'haute') THEN 'eleve'
  WHEN niveau_risque = 'critique' THEN 'critique'
  ELSE 'moyen'
END;

ALTER TABLE zones_risque ALTER COLUMN niveau_risque SET DEFAULT 'moyen';
ALTER TABLE zones_risque ALTER COLUMN rayon_m SET DEFAULT 100;
ALTER TABLE zones_risque
  ADD CONSTRAINT zones_risque_niveau_risque_check
  CHECK (niveau_risque IN ('faible', 'moyen', 'eleve', 'critique'));
ALTER TABLE zones_risque
  ADD CONSTRAINT zones_risque_rayon_m_check
  CHECK (rayon_m > 0);

CREATE INDEX IF NOT EXISTS idx_zones_risque_commune ON zones_risque(commune);
CREATE INDEX IF NOT EXISTS idx_zones_risque_niveau ON zones_risque(niveau_risque);
CREATE INDEX IF NOT EXISTS idx_points_collection_type ON points_collection(type_dechet);

COMMIT;
