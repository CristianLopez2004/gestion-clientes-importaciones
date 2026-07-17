const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const PORT = process.env.PORT || 8080;
const CLIENTES_URL = process.env.CLIENTES_URL || 'http://localhost:3001';
const SOLICITUDES_URL = process.env.SOLICITUDES_URL || 'http://localhost:3002';
const COTIZACIONES_URL = process.env.COTIZACIONES_URL || 'http://localhost:7071';

// Usuarios demo para cumplir autenticación de seguridad en la plataforma local.
// En producción se debería reemplazar por OAuth2, Azure AD B2C, Keycloak o un IAM equivalente.
const USERS = [
  {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    nombre: 'Administrador del Sistema',
    rol: 'Administrador'
  },
  {
    username: process.env.ASESOR_USER || 'asesor',
    password: process.env.ASESOR_PASSWORD || 'asesor123',
    nombre: 'Asesor Comercial',
    rol: 'Asesor'
  }
];

const activeTokens = new Map();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 4; // 4 horas para la demo local.

function createToken(user) {
  const token = crypto.randomUUID();
  activeTokens.set(token, {
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    expiresAt: Date.now() + TOKEN_TTL_MS
  });
  return token;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  const session = token ? activeTokens.get(token) : null;

  if (!session || session.expiresAt < Date.now()) {
    if (token) activeTokens.delete(token);
    return res.status(401).json({ error: 'No autenticado', detail: 'Debe iniciar sesión con usuario y contraseña.' });
  }

  req.user = session;
  next();
}

const swaggerDocument = YAML.load('./docs/openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas', detail: 'Usuario o contraseña incorrectos.' });
  }

  const token = createToken(user);
  res.json({
    token,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_MS / 1000,
    user: {
      username: user.username,
      nombre: user.nombre,
      rol: user.rol
    }
  });
});

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/auth/logout', requireAuth, (req, res) => {
  const token = getBearerToken(req);
  if (token) activeTokens.delete(token);
  res.json({ ok: true, message: 'Sesión cerrada correctamente' });
});

async function proxyRequest(req, res, targetUrl) {
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        'x-user': req.user?.username || 'anonymous',
        'x-role': req.user?.rol || 'none'
      },
      validateStatus: () => true
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en API Gateway:', error.message);
    res.status(502).json({ error: 'Servicio no disponible', detail: error.message });
  }
}

// Las rutas de negocio requieren autenticación.
app.get('/api/clientes', requireAuth, (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes`));
app.post('/api/clientes', requireAuth, (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes`));
app.get('/api/clientes/:id', requireAuth, (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes/${req.params.id}`));
app.put('/api/clientes/:id', requireAuth, (req, res) => proxyRequest(req, res, `${CLIENTES_URL}/clientes/${req.params.id}`));

app.get('/api/solicitudes', requireAuth, (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes`));
app.post('/api/solicitudes', requireAuth, (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes`));
app.patch('/api/solicitudes/:id/estado', requireAuth, (req, res) => proxyRequest(req, res, `${SOLICITUDES_URL}/solicitudes/${req.params.id}/estado`));

app.post('/api/cotizaciones/calcular', requireAuth, (req, res) => proxyRequest(req, res, `${COTIZACIONES_URL}/api/cotizacion/calcular`));

app.listen(PORT, () => {
  console.log(`API Gateway ejecutándose en puerto ${PORT}`);
  console.log(`Swagger disponible en http://localhost:${PORT}/docs`);
  console.log('Usuarios demo: admin/admin123 y asesor/asesor123');
});
