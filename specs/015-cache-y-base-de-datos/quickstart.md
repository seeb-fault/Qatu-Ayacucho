# Validación — Comportamiento de la base de datos y estrategia de caché

## Analizar la base

1. Crear una base `_test` y migrarla: `npm run migrate` en `backend/` con `DATABASE_URL` apuntando a ella.
2. Cargar los datos de carga: `node --import tsx test/carga/datos-carga.ts > /dev/null`.
3. `npm run base:analizar`: escribe `docs/06-pruebas-atributos-calidad/base-de-datos/planes.json` y `mediciones.md`.

## Ver la caché en acción

1. Backend en desarrollo (caché de 30 s por defecto). Buscar dos veces lo mismo en `http://localhost:3000`: la segunda no consulta PostgreSQL.
2. `curl -sI http://127.0.0.1:3001/api/v1/publicaciones | grep -i cache-control` → `public, max-age=30`.
3. `curl -sI "http://127.0.0.1:3001/api/v1/publicaciones?orden=x" | grep -i cache-control` → `no-store` (error).
4. Con `QATU_CACHE_SEGUNDOS=0` la caché se apaga.

## Validación local (2026-11-25)

- **Entorno:** Windows, Node.js 24, PostgreSQL 17.5 en un contenedor temporal, base `_test` con 1 000 publicaciones y 5 000 reservas.
- **Análisis:** búsquedas de 3 a 4,7 ms con sus índices; detalle 0,4 ms; disponibilidad 0,36 ms (ver docs/06-pruebas-atributos-calidad/base-de-datos/README.md).
- **Mis reservas:** de 7,59 ms y 172 bloques a **1,49 ms y 36 bloques**, mismo resultado.
- **`test/catalogo/cache.test.ts`:** 10 de 10 (9 unitarias y 1 de integración HTTP).
- **Bruno** confirmó las cabeceras y encontró el 400 cacheable (corregido).
- **k6 sin caché frente a con caché (GitHub Actions, mismo procesador, 2 000 usuarios):** p95 de 1 595 ms a **168 ms**, p50 de 1 293 ms a 3 ms, +50 % de peticiones por segundo; 0 % de errores en ambos (docs/06-pruebas-atributos-calidad/carga-2000/README.md).
