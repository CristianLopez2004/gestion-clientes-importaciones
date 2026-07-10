const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pool, initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'clientes-service' }));

app.get('/clientes', async (req, res) => {
  const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
  res.json(result.rows);
});

app.get('/clientes/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(result.rows[0]);
});

app.post('/clientes', async (req, res) => {
  const { nombre, email, telefono, empresa } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: 'nombre y email son obligatorios' });
  try {
    const result = await pool.query(
      `INSERT INTO clientes(nombre, email, telefono, empresa)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [nombre, email, telefono || null, empresa || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo crear el cliente', detail: error.message });
  }
});

app.put('/clientes/:id', async (req, res) => {
  const { nombre, email, telefono, empresa } = req.body;
  const result = await pool.query(
    `UPDATE clientes
     SET nombre = COALESCE($1, nombre),
         email = COALESCE($2, email),
         telefono = COALESCE($3, telefono),
         empresa = COALESCE($4, empresa),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [nombre, email, telefono, empresa, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(result.rows[0]);
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`clientes-service ejecutándose en puerto ${PORT}`));
}).catch((error) => {
  console.error('Error inicializando base de datos clientes:', error);
  process.exit(1);
});
