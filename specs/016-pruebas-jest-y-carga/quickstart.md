# Validación — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

## Jest

```bash
cd backend
npm test                      # solo las pruebas sin base si no hay TEST_DATABASE_URL
TEST_DATABASE_URL=postgresql://…/qatu_algo_test DATABASE_URL=$TEST_DATABASE_URL npm run migrate
TEST_DATABASE_URL=postgresql://…/qatu_algo_test npm run test:cobertura   # todo, con cobertura en backend/coverage/
```

## Carga hasta 2 000 usuarios

GitHub → Actions → **Carga k6** → *Run workflow* (o subir una rama `carga/…`). Al terminar, los artefactos `carga-2000-cache-0` y `carga-2000-cache-30` traen `k6.txt`, `resumen-k6.json`, `recursos.csv` y `entorno.json`.

## Validación local de Jest (2026-11-25)

- **Entorno:** Windows, Node.js 24, Jest 30.5.2 con SWC, PostgreSQL 17.5 en un contenedor temporal, base `_test` nueva.
- **Resultado:** **32 de 32 suites**, 90 pruebas que pasan y 1 omitida (R2 real, requiere credenciales), en 323 s. Las 90 pruebas recorren los 149 casos con nombre de las suites de integración, más las unitarias.
- **Cobertura de `src/`:** **98,8 % de sentencias y líneas, 89,8 % de ramas y 98,3 % de funciones** (`docs/06-pruebas-atributos-calidad/jest/cobertura/index.html`).
- **Hallazgos de la migración:** el contrato OpenAPI omitía los parámetros de ruta al generarse con tsx (corregido: ahora es el mismo con cualquier compilador); la prueba del almacén dependía del orden alfabético de los archivos (corregida); las comparaciones profundas entre contextos vm necesitan `test/assert-jest.ts`.
## Validación de la carga (2026-11-25, GitHub Actions)

- **Entorno:** ubuntu-24.04, 4 núcleos, 16–17 GB; PostgreSQL 17, API (un proceso de Node.js 24) y k6 2.4.0 en la misma máquina; 1 000 publicaciones y 5 000 reservas.
- **Resultado:** dos corridas × (sin caché, con caché de 30 s): **12 de 12 metas en las cuatro**, 0 % de errores y 100 % de comprobaciones correctas en todos los escalones hasta **2 000 usuarios**.
- **p95 con 2 000 usuarios:** 1 595–1 801 ms sin caché; 168–731 ms con caché (según el procesador que asignó GitHub). Con el mismo procesador, 9,5 veces menos con caché.
- Detalle: docs/06-pruebas-atributos-calidad/carga-2000/README.md.
