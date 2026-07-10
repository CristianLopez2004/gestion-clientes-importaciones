const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const PORT = process.env.PORT || 8080;
const CLIENTES_URL = process.env.CLIENTES_URL || 'http://localhost:3001';
const SOLICITUDES_URL = process.env.SOLICITUDES_URL || 'http://localhost:3002';
const COTIZACIONES_URL = process.env.COTIZACIONES_URL || 'http://localhost:7071';

const swaggerDocument = YAML.load('./docs/openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway', timestamp: new Date().toISOString() });
});

async function proxyRequest(req, res, targetUrl) {
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      validateStatus: () => true
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en API Gateway:', error.message);
    res.status(502).json({ error: 'Servicio no disponible', detail: error.message });
  }
}

app.get('/api/clientes', (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes`));
app.post('/api/clientes', (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes`));
app.get('/api/clientes/:id', (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes/${req.params.id}`));
app.put('/api/clientes/:id', (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes/${req.params.id}`));

app.get('/api/solicitudes', (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes`));
app.post('/api/solicitudes', (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes`));
app.patch('/api/solicitudes/:id/estado', (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes/${req.params.id}/estado`));

app.post('/api/cotizaciones/calcular', (req, res) => proxyRequest(req, res, `${COTIZACIONES_URL}/api/cotizacion/calcular`));

app.listen(PORT, () => {
  console.log(`API Gateway ejecutándose en puerto ${PORT}`);
  console.log(`Swagger disponible en http://localhost:${PORT}/docs`);
});
