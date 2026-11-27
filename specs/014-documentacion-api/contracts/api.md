# Contrato HTTP — Documentación de la API

| Método | Ruta | Respuesta | Errores |
|---|---|---|---|
| GET | /docs | Página Swagger UI (HTML) con sus recursos en /docs/*.js y /docs/*.css | 404 si está apagada |
| GET | /docs/openapi.json | Contrato OpenAPI 3.0 de toda la API | 404 si está apagada |

Base `/api/v1`. Encendida en desarrollo y pruebas; en producción solo con `QATU_DOCS=1`. El contrato completo está versionado en [openapi.json](../../../docs/03-diseño-de-software/diseño-externo/openapi.json) y se regenera con `npm run openapi`.
