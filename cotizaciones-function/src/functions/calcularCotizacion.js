const { app } = require('@azure/functions');

app.http('calcularCotizacion', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'cotizacion/calcular',
  handler: async (request, context) => {
    const body = await request.json().catch(() => ({}));
    const valorProducto = Number(body.valorProducto || 0);
    const envio = Number(body.envio || 0);
    const impuestosPorcentaje = Number(body.impuestosPorcentaje || 0);
    const margenPorcentaje = Number(body.margenPorcentaje || 0);

    if (valorProducto <= 0) {
      return { status: 400, jsonBody: { error: 'valorProducto debe ser mayor a 0' } };
    }

    const subtotal = valorProducto + envio;
    const impuestos = subtotal * (impuestosPorcentaje / 100);
    const margen = subtotal * (margenPorcentaje / 100);
    const total = subtotal + impuestos + margen;

    context.log('Cotización calculada', { subtotal, impuestos, margen, total });

    return {
      status: 200,
      jsonBody: {
        moneda: 'USD',
        valorProducto,
        envio,
        subtotal: Number(subtotal.toFixed(2)),
        impuestos: Number(impuestos.toFixed(2)),
        margen: Number(margen.toFixed(2)),
        totalEstimado: Number(total.toFixed(2))
      }
    };
  }
});
