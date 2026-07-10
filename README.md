# Sistema de Gestión de Clientes e Importaciones

Proyecto integrador de arquitectura de software. Implementa una solución básica con API Gateway, microservicios, capa de datos en Docker, cola de mensajería Kafka y una función serverless para cálculo de cotizaciones.

## Arquitectura implementada

- **API Gateway:** expone la API REST centralizada y documentación Swagger.
- **Servicio de Clientes:** registra y consulta clientes.
- **Servicio de Solicitudes de Importación:** registra solicitudes y publica eventos en Kafka.
- **Cotizaciones Function:** función tipo serverless para calcular cotizaciones.
- **PostgreSQL:** capa de datos en Docker.
- **Kafka:** gestor de colas/mensajería para eventos de importación.

## Requisitos

- Docker Desktop instalado y abierto.
- Git opcional.

## Ejecución

Desde la carpeta raíz del proyecto:

```bash
docker compose up --build
```

Cuando termine de levantar, abre:

- Swagger API Gateway: http://localhost:8080/docs
- Health API Gateway: http://localhost:8080/health
- Azure Function local: http://localhost:7071/api/cotizacion/calcular

## Flujo de prueba recomendado

### 1. Crear cliente

```bash
curl -X POST http://localhost:8080/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Cliente Demo","email":"cliente@demo.com","telefono":"0999999999","empresa":"Importadora Demo"}'
```

### 2. Listar clientes

```bash
curl http://localhost:8080/api/clientes
```

### 3. Crear solicitud de importación

```bash
curl -X POST http://localhost:8080/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":1,"producto":"Audífonos Bluetooth","descripcion":"Importación desde China","pais_origen":"China","cantidad":100}'
```

### 4. Calcular cotización con función serverless

```bash
curl -X POST http://localhost:8080/api/cotizaciones/calcular \
  -H "Content-Type: application/json" \
  -d '{"valorProducto":500,"envio":120,"impuestosPorcentaje":12,"margenPorcentaje":20}'
```

## Evidencias sugeridas para el informe

1. Captura de `docker compose up --build` con contenedores ejecutándose.
2. Captura de Swagger en `http://localhost:8080/docs`.
3. Captura creando un cliente desde Swagger o curl.
4. Captura creando una solicitud de importación.
5. Captura de logs del servicio de solicitudes publicando evento en Kafka.
6. Captura de la función serverless calculando una cotización.
7. Captura de la base de datos PostgreSQL con registros creados.

## Limpieza

Para detener y eliminar contenedores:

```bash
docker compose down
```

Para borrar también la base de datos local:

```bash
docker compose down -v
```
