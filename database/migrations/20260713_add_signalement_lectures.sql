-- ============================================================
-- Migration EcoKin - 13/07/2026
-- Ajoute le marquage "lu" (définitif) des signalements par utilisateur,
-- utilisé sur la carte de l'espace UTILISATEUR.
-- À exécuter sur une base existante :
--   psql -d ecokin -f database/migrations/20260713_add_signalement_lectures.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS signalement_lectures (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signalement_id INT NOT NULL REFERENCES signalements(id) ON DELETE CASCADE,
  date_lecture TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, signalement_id)
);

CREATE INDEX IF NOT EXISTS idx_signalement_lectures_user_id ON signalement_lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_signalement_lectures_signalement_id ON signalement_lectures(signalement_id);

COMMIT;
