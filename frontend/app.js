const API_BASE = 'http://localhost:8080';

const state = {
  clientes: [],
  solicitudes: [],
  ultimaCotizacion: 0
};

const $ = (id) => document.getElementById(id);

function toast(message, type = 'ok') {
  const node = $('toast');
  node.textContent = message;
  node.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => node.className = 'toast', 3200);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.detail || 'Error consultando API');
  return data;
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function renderStats() {
  $('statClientes').textContent = state.clientes.length;
  $('statSolicitudes').textContent = state.solicitudes.length;
  $('statProceso').textContent = state.solicitudes.filter(s => String(s.estado || '').toUpperCase().includes('PROCESO')).length;
  $('statCotizacion').textContent = formatMoney(state.ultimaCotizacion);
}

function renderClientes() {
  const list = $('clientesList');
  const select = $('solCliente');

  select.innerHTML = '';
  if (state.clientes.length === 0) {
    select.innerHTML = '<option value="">Primero registra un cliente</option>';
    list.className = 'list empty';
    list.textContent = 'Sin clientes todavía.';
    renderStats();
    return;
  }

  list.className = 'list';
  list.innerHTML = state.clientes.map(c => `
    <div class="item">
      <div class="item-top">
        <div>
          <h3>${escapeHtml(c.nombre)}</h3>
          <p>${escapeHtml(c.email)}</p>
          <p>${escapeHtml(c.empresa || 'Sin empresa')} · ${escapeHtml(c.telefono || 'Sin teléfono')}</p>
        </div>
        <span class="badge">ID ${c.id}</span>
      </div>
    </div>
  `).join('');

  select.innerHTML = state.clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)} - ${escapeHtml(c.empresa || 'Cliente')}</option>`).join('');
  renderStats();
}

function renderSolicitudes() {
  const list = $('solicitudesList');
  if (state.solicitudes.length === 0) {
    list.className = 'list empty';
    list.textContent = 'Sin solicitudes todavía.';
    renderStats();
    return;
  }

  list.className = 'list';
  list.innerHTML = state.solicitudes.map(s => `
    <div class="item">
      <div class="item-top">
        <div>
          <h3>${escapeHtml(s.producto)}</h3>
          <p>${escapeHtml(s.descripcion || 'Sin descripción')}</p>
          <p>Cliente ID: ${s.cliente_id} · Origen: ${escapeHtml(s.pais_origen || 'China')} · Cantidad: ${s.cantidad}</p>
        </div>
        <span class="badge">${escapeHtml(s.estado || 'Creada')}</span>
      </div>
      <div class="item-actions">
        <button class="small-btn" onclick="actualizarEstado(${s.id}, 'EN_PROCESO')">Marcar en proceso</button>
        <button class="small-btn" onclick="actualizarEstado(${s.id}, 'FINALIZADA')">Finalizar</button>
      </div>
    </div>
  `).join('');
  renderStats();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

async function cargarDatos() {
  try {
    const [clientes, solicitudes] = await Promise.all([
      api('/api/clientes'),
      api('/api/solicitudes')
    ]);
    state.clientes = Array.isArray(clientes) ? clientes : [];
    state.solicitudes = Array.isArray(solicitudes) ? solicitudes : [];
    renderClientes();
    renderSolicitudes();
  } catch (error) {
    toast(`No se pudo cargar datos: ${error.message}`, 'error');
  }
}

$('btnRefresh').addEventListener('click', cargarDatos);

$('clienteForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/clientes', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('clienteNombre').value,
        email: $('clienteEmail').value,
        telefono: $('clienteTelefono').value,
        empresa: $('clienteEmpresa').value
      })
    });
    event.target.reset();
    toast('Cliente creado correctamente');
    await cargarDatos();
  } catch (error) {
    toast(error.message, 'error');
  }
});

$('solicitudForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/solicitudes', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: Number($('solCliente').value),
        producto: $('solProducto').value,
        descripcion: $('solDescripcion').value,
        pais_origen: $('solPais').value,
        cantidad: Number($('solCantidad').value)
      })
    });
    event.target.reset();
    $('solPais').value = 'China';
    $('solCantidad').value = 100;
    toast('Solicitud creada y evento enviado a Kafka');
    await cargarDatos();
  } catch (error) {
    toast(error.message, 'error');
  }
});

$('cotizacionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await api('/api/cotizaciones/calcular', {
      method: 'POST',
      body: JSON.stringify({
        valorProducto: Number($('valorProducto').value),
        envio: Number($('envio').value),
        impuestosPorcentaje: Number($('impuestosPorcentaje').value),
        margenPorcentaje: Number($('margenPorcentaje').value)
      })
    });
    state.ultimaCotizacion = result.totalEstimado;
    $('cotizacionResult').innerHTML = `
      <span>Total estimado</span>
      <strong>${formatMoney(result.totalEstimado)}</strong>
      <p>Subtotal: ${formatMoney(result.subtotal)} · Impuestos: ${formatMoney(result.impuestos)} · Margen: ${formatMoney(result.margen)}</p>
    `;
    toast('Cotización calculada con función serverless');
    renderStats();
  } catch (error) {
    toast(error.message, 'error');
  }
});

async function actualizarEstado(id, estado) {
  try {
    await api(`/api/solicitudes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    });
    toast(`Solicitud actualizada a ${estado}`);
    await cargarDatos();
  } catch (error) {
    toast(error.message, 'error');
  }
}

window.actualizarEstado = actualizarEstado;
cargarDatos();
