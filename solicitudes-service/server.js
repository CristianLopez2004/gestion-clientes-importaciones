const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pool, initDb } = require('./db');
const { initKafka, publishEvent } = require('./kafka');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const PORT = process.env.PORT || 3002;

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'solicitudes-service' }));

app.get('/solicitudes', async (req, res) => {
  const result = await pool.query('SELECT * FROM solicitudes_importacion ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/solicitudes', async (req, res) => {
  const { cliente_id, producto, descripcion, pais_origen, cantidad } = req.body;
  if (!cliente_id || !producto || !cantidad) {
    return res.status(400).json({ error: 'cliente_id, producto y cantidad son obligatorios' });
  }

  const result = await pool.query(
    `INSERT INTO solicitudes_importacion(cliente_id, producto, descripcion, pais_origen, cantidad)
     VALUES($1, $2, $3, $4, $5)
     RETURNING *`,
    [cliente_id, producto, descripcion || null, pais_origen || 'China', cantidad]
  );

  const solicitud = result.rows[0];
  await publishEvent('solicitud.creada', solicitud);

  res.status(201).json({ ...solicitud, mensaje: 'Solicitud creada y evento enviado a Kafka' });
});

app.patch('/solicitudes/:id/estado', async (req, res) => {
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es obligatorio' });

  const result = await pool.query(
    `UPDATE solicitudes_importacion
     SET estado = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [estado, req.params.id]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });

  await publishEvent('solicitud.estado_actualizado', result.rows[0]);
  res.json(result.rows[0]);
});

async function start() {
  await initDb();
  await initKafka();
  app.listen(PORT, () => console.log(`solicitudes-service ejecutándose en puerto ${PORT}`));
}

start().catch((error) => {
  console.error('Error iniciando solicitudes-service:', error);
  process.exit(1);
});
