// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   database: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
// });

// pool.on('error', (err) => {
//   console.error('Erreur inattendue sur le pool PostgreSQL', err);
//   process.exit(-1);
// });

// module.exports = pool;
const { Pool } = require('pg');
require('dotenv').config();

// En production (Render), on utilise DATABASE_URL fourni par Render.
// En local, on garde les variables DB_HOST/DB_PORT/...
const useConnectionString = !!process.env.DATABASE_URL;

const pool = useConnectionString
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Render exige SSL
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool PostgreSQL', err);
  process.exit(-1);
});

module.exports = pool;