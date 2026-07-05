const pool = require('../config/db');

const SignalementModel = {
  async create({ userId, titre, description, adresse, latitude, longitude, photoPath }) {
    const result = await pool.query(
      `INSERT INTO signalements (user_id, titre, description, adresse, latitude, longitude, photo_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, titre, description, adresse, latitude, longitude, photoPath]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT s.*, u.nom AS user_nom, u.prenom AS user_prenom, u.commune AS user_commune
       FROM signalements s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByUser(userId, { statut } = {}) {
    const params = [userId];
    let query = `SELECT * FROM signalements WHERE user_id = $1`;
    if (statut) {
      params.push(statut);
      query += ` AND statut = $${params.length}`;
    }
    query += ' ORDER BY date_creation DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findAll({ statut, commune } = {}) {
    const conditions = [];
    const params = [];
    let query = `
      SELECT s.*, u.nom AS user_nom, u.prenom AS user_prenom, u.commune AS user_commune
      FROM signalements s
      JOIN users u ON u.id = s.user_id
    `;
    if (statut) {
      params.push(statut);
      conditions.push(`s.statut = $${params.length}`);
    }
    if (commune) {
      params.push(commune);
      conditions.push(`u.commune = $${params.length}`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY s.date_creation DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  // Utilisé pour la carte publique : signalements visibles après validation ou prise en charge
  async findValidatedForMap({ commune } = {}) {
    const params = [];
    let query = `
      SELECT s.id, s.titre, s.description, s.adresse, s.latitude, s.longitude,
             s.photo_path, s.date_creation, u.commune AS user_commune
      FROM signalements s
      JOIN users u ON u.id = s.user_id
      WHERE s.statut IN ('valide', 'en_cours', 'traite')
    `;
    if (commune) {
      params.push(commune);
      query += ` AND u.commune = $${params.length}`;
    }
    query += ' ORDER BY s.date_creation DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async updateStatut(id, { statut, motifRejet, validatedBy }) {
    const result = await pool.query(
      `UPDATE signalements
       SET statut = $1, motif_rejet = $2, validated_by = $3,
           date_validation = CASE WHEN $1 = 'en_attente' THEN NULL ELSE NOW() END
       WHERE id = $4
       RETURNING *`,
      [statut, motifRejet || null, validatedBy, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM signalements WHERE id = $1', [id]);
  },

  async countAll() {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM signalements');
    return result.rows[0].count;
  },

  async countByStatutForUser(userId, statut) {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM signalements WHERE user_id = $1 AND statut = $2',
      [userId, statut]
    );
    return result.rows[0].count;
  },

  async countTraites() {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM signalements WHERE statut = 'traite'`
    );
    return result.rows[0].count;
  },
};

module.exports = SignalementModel;
