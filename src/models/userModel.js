const pool = require('../config/db');

const PUBLIC_FIELDS = `id, email, nom, prenom, commune, role, is_blocked, date_inscription`;

const UserModel = {
  async create({ email, hashedPassword, nom, prenom, commune }) {
    const result = await pool.query(
      `INSERT INTO users (email, password, nom, prenom, commune)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PUBLIC_FIELDS}`,
      [email, hashedPassword, nom, prenom, commune]
    );
    return result.rows[0];
  },

  // Création par un admin — peut définir le rôle dès la création.
  async createByAdmin({ email, hashedPassword, nom, prenom, commune, role }) {
    const result = await pool.query(
      `INSERT INTO users (email, password, nom, prenom, commune, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PUBLIC_FIELDS}`,
      [email, hashedPassword, nom, prenom, commune, role || 'user']
    );
    return result.rows[0];
  },

  // Modification par un admin — peut changer le rôle d'un autre utilisateur.
  async updateByAdmin(id, { nom, prenom, email, commune, role }) {
    const result = await pool.query(
      `UPDATE users
       SET nom = $1, prenom = $2, email = $3, commune = $4, role = $5, date_modification = NOW()
       WHERE id = $6
       RETURNING ${PUBLIC_FIELDS}`,
      [nom, prenom, email, commune, role, id]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY date_inscription DESC`
    );
    return result.rows;
  },

  async updateProfile(id, { nom, prenom, email, commune }) {
    const result = await pool.query(
      `UPDATE users
       SET nom = $1, prenom = $2, email = $3, commune = $4, date_modification = NOW()
       WHERE id = $5
       RETURNING ${PUBLIC_FIELDS}`,
      [nom, prenom, email, commune, id]
    );
    return result.rows[0];
  },

  async updatePassword(id, hashedPassword) {
    await pool.query(
      `UPDATE users SET password = $1, date_modification = NOW() WHERE id = $2`,
      [hashedPassword, id]
    );
  },

  async setBlocked(id, isBlocked) {
    const result = await pool.query(
      `UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING ${PUBLIC_FIELDS}`,
      [isBlocked, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  },

  async setResetToken(id, token, expires) {
    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [token, expires, id]
    );
  },

  async findByResetToken(token) {
    const result = await pool.query(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );
    return result.rows[0];
  },

  async clearResetToken(id) {
    await pool.query(
      `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1`,
      [id]
    );
  },

  async countAll() {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    return result.rows[0].count;
  },

  async countCreatedSince(days) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE date_inscription >= NOW() - ($1 || ' days')::interval`,
      [days]
    );
    return result.rows[0].count;
  },
};

module.exports = UserModel;
