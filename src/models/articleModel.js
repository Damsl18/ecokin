const pool = require('../config/db');

const ArticleModel = {
  async create({ auteurId, titre, contenu, categorie, coverImagePath }) {
    const result = await pool.query(
      `INSERT INTO articles (auteur_id, titre, contenu, categorie, cover_image_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [auteurId, titre, contenu, categorie || null, coverImagePath]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT a.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom
       FROM articles a
       JOIN users u ON u.id = a.auteur_id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByAuteur(auteurId) {
    const result = await pool.query(
      'SELECT * FROM articles WHERE auteur_id = $1 ORDER BY date_creation DESC',
      [auteurId]
    );
    return result.rows;
  },

  async findAll({ statut } = {}) {
    const params = [];
    let query = `
      SELECT a.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom
      FROM articles a JOIN users u ON u.id = a.auteur_id
    `;
    if (statut) {
      params.push(statut);
      query += ` WHERE a.statut = $${params.length}`;
    }
    query += ' ORDER BY a.date_creation DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  // Public : articles publiés, avec recherche + pagination
  async findPublished({ search, page = 1, limit = 9 } = {}) {
    const params = [];
    let query = `
      SELECT a.id, a.titre, a.contenu, a.categorie, a.cover_image_path,
             a.date_publication, u.nom AS auteur_nom, u.prenom AS auteur_prenom
      FROM articles a JOIN users u ON u.id = a.auteur_id
      WHERE a.statut = 'publie'
    `;
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.titre ILIKE $${params.length} OR a.contenu ILIKE $${params.length})`;
    }
    query += ' ORDER BY a.date_publication DESC';
    params.push(limit);
    query += ` LIMIT $${params.length}`;
    params.push((page - 1) * limit);
    query += ` OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async countPublished({ search } = {}) {
    const params = [];
    let query = `SELECT COUNT(*)::int AS count FROM articles WHERE statut = 'publie'`;
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (titre ILIKE $${params.length} OR contenu ILIKE $${params.length})`;
    }
    const result = await pool.query(query, params);
    return result.rows[0].count;
  },

  async update(id, { titre, contenu, categorie, coverImagePath }) {
    const result = await pool.query(
      `UPDATE articles
       SET titre = $1, contenu = $2, categorie = $3,
           cover_image_path = COALESCE($4, cover_image_path)
       WHERE id = $5
       RETURNING *`,
      [titre, contenu, categorie || null, coverImagePath, id]
    );
    return result.rows[0];
  },

  async updateStatut(id, { statut, validatedBy }) {
    const datePublication = statut === 'publie' ? 'NOW()' : 'NULL';
    const result = await pool.query(
      `UPDATE articles
       SET statut = $1, validated_by = $2, date_publication = ${datePublication}
       WHERE id = $3
       RETURNING *`,
      [statut, validatedBy, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
  },

  async countAll() {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM articles');
    return result.rows[0].count;
  },

  async countPublishedTotal() {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM articles WHERE statut = 'publie'`
    );
    return result.rows[0].count;
  },

  async countByStatutForAuteur(auteurId, statut) {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM articles WHERE auteur_id = $1 AND statut = $2',
      [auteurId, statut]
    );
    return result.rows[0].count;
  },
};

module.exports = ArticleModel;
