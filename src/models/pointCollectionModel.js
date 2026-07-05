const pool = require('../config/db');

const PointCollectionModel = {
  async create({ nom, adresse, latitude, longitude, typeDechet, horaires, contact }) {
    const result = await pool.query(
      `INSERT INTO points_collection (nom, adresse, latitude, longitude, type_dechet, horaires, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nom, adresse, latitude, longitude, typeDechet, horaires, contact]
    );
    return result.rows[0];
  },

  async findAll({ typeDechet } = {}) {
    const params = [];
    let query = 'SELECT * FROM points_collection';
    if (typeDechet) {
      params.push(typeDechet);
      query += ` WHERE type_dechet = $${params.length}`;
    }
    query += ' ORDER BY nom ASC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM points_collection WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { nom, adresse, latitude, longitude, typeDechet, horaires, contact }) {
    const result = await pool.query(
      `UPDATE points_collection
       SET nom = $1, adresse = $2, latitude = $3, longitude = $4,
           type_dechet = $5, horaires = $6, contact = $7
       WHERE id = $8
       RETURNING *`,
      [nom, adresse, latitude, longitude, typeDechet, horaires, contact, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM points_collection WHERE id = $1', [id]);
  },
};

module.exports = PointCollectionModel;
