# 014 — Documentación y pruebas de contrato de la API

**Estado:** etapa 1 (014.1, Swagger/OpenAPI, 2026-11-19) y etapa 2 (014.2, colección Bruno, 2026-11-25) implementadas.
**Módulos técnicos:** compartido (documento OpenAPI y página) y la capa de presentación de todos los módulos. **Historias:** requisito del Sprint 2, actividad 4: «Endpoints REST funcionales y documentados con OpenAPI/Swagger».

## Objetivo y alcance

Que la API REST de Qatu tenga un contrato legible por máquinas y una página para explorarla y probarla, sin que el contrato se separe del código.

- **Etapa 1 (014.1):** OpenAPI 3 generado desde los controladores con `@nestjs/swagger`; página Swagger UI en `/api/v1/docs`; contrato versionado en `docs/03-diseño-de-software/diseño-externo/openapi.json`; pruebas que fallan si una ruta no está documentada o si el archivo no coincide con el código.
- **Etapa 2 (014.2):** colección Bruno (`docs/06-pruebas-atributos-calidad/bruno/`) con 36 peticiones y 45 pruebas de contrato y reglas de negocio, ejecutada en el CI con reporte HTML, JSON y JUnit.
- **Fuera de alcance:** cambiar el comportamiento de los endpoints, versionar la API más allá de `/api/v1` y publicar la página en producción de forma permanente.

## User Scenarios & Testing

### US1 — Explorar la API (P1)

Como integrante del equipo o docente, quiero ver todos los endpoints con sus datos de entrada, respuestas y errores.
**Prueba independiente:** Dado el backend en desarrollo, cuando abro `/api/v1/docs`, entonces veo los endpoints agrupados por módulo, con su acceso (público, sesión o administrador), cuerpo, parámetros y respuestas, y puedo descargar `openapi.json`.
**Caso negativo:** en producción, sin `QATU_DOCS=1`, la página y el JSON responden 404.

### US2 — Probar desde la página (P1)

Como desarrollador, quiero ejecutar peticiones reales desde Swagger, incluidas las que exigen sesión.
**Prueba independiente:** Dado que abro la página por el frontend (`http://localhost:3000/api/v1/docs`), cuando ejecuto `POST /auth/login` y luego `GET /usuarios/me`, entonces la segunda responde 200: el navegador guarda la cookie `qatu_sesion` y envía el `Origin` correcto.
**Caso negativo:** abierta directamente en el puerto de la API, las escrituras responden 403 `ORIGEN_INVALIDO`, como cualquier origen ajeno.

### US3 — Contrato siempre al día (P1)

Como mantenedor, quiero que un endpoint nuevo sin documentar o un contrato desactualizado rompan el CI.
**Prueba independiente:** Dado un controlador con una ruta sin `@Doc`, cuando corre `npm test`, entonces falla la prueba de cobertura; dado un cambio en los decoradores sin regenerar el archivo, falla la comparación con `openapi.json`.

## Requisitos

- **M014-FR01:** Toda ruta registrada en Nest aparece en el contrato con resumen, una etiqueta conocida y al menos una respuesta 2xx.
- **M014-FR02:** Los errores usan el esquema común `{ code, mensaje, correlationId }`.
- **M014-FR03:** Las escrituras documentan el 403 por `Origin`; las rutas con sesión, el 401; las de administración, el 403 por rol.
- **M014-FR04:** Los cuerpos JSON se describen como objetos estrictos (`additionalProperties: false`), con los límites de las validaciones de dominio.
- **M014-FR05:** La página está encendida en desarrollo y pruebas y apagada en producción salvo `QATU_DOCS=1`.
- **M014-FR06:** La página no llama a servicios externos (sin validador en línea ni telemetría de instalación).

## Criterios de aceptación

- **AC01:** 94 operaciones documentadas, sin referencias rotas ni `operationId` repetidos.
- **AC02:** `npm test` incluye `test/compartido/openapi.test.ts` y pasa en el CI.
- **AC03:** `GET /api/v1/docs` sirve Swagger UI y sus recursos; `GET /api/v1/docs/openapi.json` sirve el contrato; con `QATU_DOCS=0`, 404.
