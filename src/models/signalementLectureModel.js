const pool = require('../config/db');

const SignalementLectureModel = {
  // Marquage définitif : si déjà lu, ne fait rien (ON CONFLICT DO NOTHING).
  async markAsRead(userId, signalementId) {
    const result = await pool.query(
      `INSERT INTO signalement_lectures (user_id, signalement_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, signalement_id) DO NOTHING
       RETURNING *`,
      [userId, signalementId]
    );
    if (result.rows[0]) return result.rows[0];

    // Déjà marqué précédemment : on renvoie la ligne existante pour confirmer l'état.
    const existing = await pool.query(
      `SELECT * FROM signalement_lectures WHERE user_id = $1 AND signalement_id = $2`,
      [userId, signalementId]
    );
    return existing.rows[0];
  },

  // Retourne la liste des IDs de signalements lus par l'utilisateur (pour affichage carte).
  async listReadIdsForUser(userId) {
    const result = await pool.query(
      `SELECT signalement_id FROM signalement_lectures WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((r) => r.signalement_id);
  },
};

module.exports = SignalementLectureModel;
