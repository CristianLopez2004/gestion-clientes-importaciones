# Sistema de Gestión de Clientes e Importaciones

Proyecto integrador de arquitectura de software. Implementa una solución básica con API Gateway, microservicios, capa de datos en Docker, cola de mensajería Kafka y una función serverless para cálculo de cotizaciones.

## Arquitectura implementada

- **Frontend Web CRM:** portal demo local para registrar clientes, solicitudes y cotizaciones.
- **API Gateway:** expone la API REST centralizada, autenticación por usuario/contraseña y documentación Swagger.
- **Servicio de Clientes:** registra y consulta clientes.
- **Servicio de Solicitudes de Importación:** registra solicitudes y publica eventos en Kafka.
- **Cotizaciones Function:** función tipo serverless para calcular cotizaciones.
- **PostgreSQL:** capa de datos en Docker.
- **Kafka:** gestor de colas/mensajería para eventos de importación.
- **Autenticación:** login demo con usuario, contraseña, token Bearer y protección de rutas de negocio.

## Requisitos

- Docker Desktop instalado y abierto.
- Git opcional.

## Ejecución

Desde la carpeta raíz del proyecto:

```bash
docker compose up --build
```

Cuando termine de levantar, abre:

- Plataforma Web Demo: http://localhost:5173
- Login demo administrador: `admin` / `admin123`
- Login demo asesor: `asesor` / `asesor123`
- Swagger API Gateway: http://localhost:8080/docs
- Health API Gateway: http://localhost:8080/health
- Azure Function local: http://localhost:7071/api/cotizacion/calcular

## Flujo de prueba recomendado

### 0. Iniciar sesión y obtener token

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copia el valor de `token` y úsalo como Bearer Token en las rutas protegidas.

### 1. Crear cliente

```bash
curl -X POST http://localhost:8080/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"nombre":"Cliente Demo","email":"cliente@demo.com","telefono":"0999999999","empresa":"Importadora Demo"}'
```

### 2. Listar clientes

```bash
curl http://localhost:8080/api/clientes \
  -H "Authorization: Bearer TU_TOKEN"
```

### 3. Crear solicitud de importación

```bash
curl -X POST http://localhost:8080/api/solicitudes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"cliente_id":1,"producto":"Audífonos Bluetooth","descripcion":"Importación desde China","pais_origen":"China","cantidad":100}'
```

### 4. Calcular cotización con función serverless

```bash
curl -X POST http://localhost:8080/api/cotizaciones/calcular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"valorProducto":500,"envio":120,"impuestosPorcentaje":12,"margenPorcentaje":20}'
```

## Evidencias sugeridas para el informe

1. Captura de `docker compose up --build` con contenedores ejecutándose.
2. Captura de pantalla de login con usuario y contraseña en `http://localhost:5173`.
3. Captura de la plataforma web demo después de iniciar sesión.
4. Captura registrando un cliente desde la plataforma web.
5. Captura creando una solicitud de importación desde la plataforma web.
6. Captura calculando una cotización desde la plataforma web.
7. Captura de Swagger en `http://localhost:8080/docs` mostrando `/auth/login` y botón Authorize.
8. Captura de logs del servicio de solicitudes publicando evento en Kafka.
9. Captura de Docker Desktop con los contenedores activos.

## Limpieza

Para detener y eliminar contenedores:

```bash
docker compose down
```

Para borrar también la base de datos local:

```bash
docker compose down -v
```
