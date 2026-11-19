# Validación — Documentación y pruebas de contrato de la API

## Abrir la página

1. Levantar el backend (`npm run dev` en `backend/`) y el frontend (`npm run dev` en `frontend/`).
2. Abrir **`http://localhost:3000/api/v1/docs`**, por el frontend para que el navegador envíe el `Origin` correcto y guarde la cookie.
3. Desplegar **Usuarios → POST /api/v1/auth/login → Try it out**, escribir un correo y una contraseña de una cuenta de desarrollo y pulsar **Execute**: 200 y la cookie queda guardada.
4. Probar **Usuarios → GET /api/v1/usuarios/me → Execute**: 200 con tu perfil.
5. El contrato se descarga en `http://localhost:3000/api/v1/docs/openapi.json`.

## Regenerar el contrato

Después de cambiar un endpoint o su `@Doc`: `npm run openapi` en `backend/` y subir `docs/03-diseño-de-software/diseño-externo/openapi.json` en el mismo commit. `npm test` falla si se olvida.

## Validación local de la etapa 1 (2026-11-19)

- **Entorno:** Windows, Node.js 24, PostgreSQL 17.5 en Docker, base nueva `_test` borrada al terminar.
- **`test/compartido/openapi.test.ts`: 4 de 4.** 94 operaciones, todas con resumen, una etiqueta conocida, respuesta 2xx y errores con el esquema `Error`; sin referencias rotas; archivo al día; página y recursos servidos; 404 con `QATU_DOCS=0`.
- **`npx tsc --noEmit`:** sin errores.
- **`npm audit --omit=dev`:** 0 vulnerabilidades (se corrigieron 3 altas previas de `multer` y `body-parser`).
- **Suite completa del backend (`npm test`):** 227 de 230, 1 omitida (R2 real). Las 2 fallas fueron de Pagos, por 503 al agotarse el tiempo de conexión a PostgreSQL con 20 peticiones simultáneas y menos de 1 GB de RAM libre en el equipo. Repetidas solas en una base nueva: **22 de 22**. Ningún controlador cambió su lógica: los cambios son solo decoradores.
