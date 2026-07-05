const pool = require('../config/db');

const ZoneRisqueModel = {
  async create({ nom, description, commune, niveauRisque, latitude, longitude, rayonM }) {
    const result = await pool.query(
      `INSERT INTO zones_risque (nom, description, commune, niveau_risque, latitude, longitude, rayon_m)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nom, description || null, commune || null, niveauRisque, latitude, longitude, rayonM || 100]
    );
    return result.rows[0];
  },

  async findAll({ commune, niveauRisque } = {}) {
    const params = [];
    const conditions = [];
    let query = 'SELECT * FROM zones_risque';

    if (commune) {
      params.push(commune);
      conditions.push(`commune = $${params.length}`);
    }
    if (niveauRisque) {
      params.push(niveauRisque);
      conditions.push(`niveau_risque = $${params.length}`);
    }

    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY date_creation DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM zones_risque WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { nom, description, commune, niveauRisque, latitude, longitude, rayonM }) {
    const result = await pool.query(
      `UPDATE zones_risque
       SET nom = $1, description = $2, commune = $3, niveau_risque = $4,
           latitude = $5, longitude = $6, rayon_m = $7, date_modification = NOW()
       WHERE id = $8
       RETURNING *`,
      [nom, description || null, commune || null, niveauRisque, latitude, longitude, rayonM || 100, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM zones_risque WHERE id = $1', [id]);
  },
};

module.exports = ZoneRisqueModel;
