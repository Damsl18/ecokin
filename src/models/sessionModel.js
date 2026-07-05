const pool = require('../config/db');

const SessionModel = {
  async create(userId, token, expirationDate) {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, token, date_expiration)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, token, expirationDate]
    );
    return result.rows[0];
  },

  async findByToken(token) {
    const result = await pool.query(
      `SELECT s.*, u.id AS user_id, u.nom, u.prenom, u.email, u.commune,
              u.role, u.is_blocked
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.date_expiration > NOW()`,
      [token]
    );
    return result.rows[0];
  },

  async deleteByToken(token) {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  },

  async deleteExpired() {
    await pool.query('DELETE FROM sessions WHERE date_expiration <= NOW()');
  },
};

module.exports = SessionModel;
