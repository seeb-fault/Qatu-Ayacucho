# Plan — Documentación y pruebas de contrato de la API

## Etapa 1 (014.1) — Swagger/OpenAPI

- **Compartido:**
  - `src/shared/presentacion/openapi.ts`: decorador `@Doc({...})`, uno por endpoint, encima de `@Get/@Post/...`. Lee el método y el `@HttpCode` que ya declara Nest y agrega solo la sesión, los errores comunes y la nota de `Origin`. Atajos para esquemas (`objeto`, `texto`, `entero`, `opciones`, `nulableRef`…) y un registro de esquemas reutilizables por módulo.
  - `src/shared/infraestructura/documentacion-api.ts`: `crearDocumento` (título, convenciones, cookie `qatu_sesion`, etiquetas, esquema `Error`) y `publicarDocumentacion` (`/api/v1/docs` y `/api/v1/docs/openapi.json`). `documentacionHabilitada` decide por `QATU_DOCS` y `NODE_ENV`.
  - `app.ts` publica la página al crear la app cuando está habilitada.
- **Módulos:** cada `presentacion/openapi.ts` registra sus esquemas (respuestas) y exporta los cuerpos de entrada; los controladores llevan `@ApiTags` y `@Doc`. No cambia la lógica de ningún endpoint. Las categorías y zonas del catálogo se toman del dominio.
- **Contrato versionado:** `npm run openapi` escribe `docs/03-diseño-de-software/diseño-externo/openapi.json`; `npm run openapi:comprobar` falla si no coincide. No necesita base de datos.
- **Pruebas:** `test/compartido/openapi.test.ts` (cobertura de rutas, reglas del contrato, archivo al día, página servida y apagada).
- **Despliegue:** `QATU_DOCS` en `infra/compose.production.yml` (0 por defecto) y en el runbook.

## Etapa 2 — Bruno

Colección en `docs/06-pruebas-atributos-calidad/bruno/`, importada desde `openapi.json` y completada con flujos (registro → publicación → reserva), entornos `local` y `produccion` sin secretos, y un paso del CI que la ejecuta contra la API y guarda el reporte HTML.
