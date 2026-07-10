const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'importacionesdb',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword'
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_importacion (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      producto VARCHAR(200) NOT NULL,
      descripcion TEXT,
      pais_origen VARCHAR(100) DEFAULT 'China',
      cantidad INTEGER NOT NULL DEFAULT 1,
      estado VARCHAR(50) NOT NULL DEFAULT 'Creada',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_importacion(cliente_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_importacion(estado);`);
}

module.exports = { pool, initDb };
