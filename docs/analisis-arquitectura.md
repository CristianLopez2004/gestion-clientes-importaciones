# Análisis arquitectónico

## Caché
Se propone agregar caché en el API Gateway para consultas frecuentes de clientes y catálogos. Esto reduce lecturas repetidas en la base de datos y mejora el tiempo de respuesta.

## Balanceo
El balanceo se realiza a nivel de contenedores/microservicios. En un entorno productivo se puede usar Kubernetes Service o Load Balancer para distribuir tráfico entre varias réplicas.

## Indexación
Se implementan índices en `clientes.email`, `solicitudes_importacion.cliente_id` y `solicitudes_importacion.estado`, porque son campos comunes para búsqueda, filtrado y seguimiento.

## Redundancia y disponibilidad
En producción se recomienda desplegar varias réplicas de API Gateway y microservicios, además de base de datos administrada con respaldo automático.

## Concurrencia
Los servicios REST reciben múltiples solicitudes concurrentes. Kafka permite procesar eventos de forma asíncrona sin bloquear el flujo principal.

## Latencia
La latencia se reduce separando responsabilidades: el registro se guarda en base de datos y el procesamiento posterior se delega a eventos.

## Costo y proyección
La solución local usa Docker para reducir costos académicos. En la nube, los componentes principales serían AKS, Azure SQL, Kafka administrado o Event Hubs, Azure Functions y Key Vault.

## Performance y escalabilidad
Los microservicios permiten escalar de manera independiente. Si crecen las solicitudes de importación, se escala solo el servicio de solicitudes sin afectar el servicio de clientes.
