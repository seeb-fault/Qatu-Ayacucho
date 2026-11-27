# Plan — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

## Jest

- `backend/jest.config.cjs`: entorno node, SWC (`@swc/jest`) con decoradores, `maxWorkers: 1`, `testTimeout` de 10 min, cobertura V8 de `src/`.
- Migración de las 31 suites de `node:test`: `import { test } from '@jest/globals'`; `{ skip }` → `test.skip`; `context.test` → `caso` (`test/caso.ts`). Conversión hecha con un script y verificada por conteo (149 casos antes y después).
- `test/entorno-pruebas.ts` (setupFiles): carga `backend/.env` sin pisar variables y fuerza el almacén PostgreSQL.
- `test/assert-jest.ts`: `node:assert/strict` con comparación profunda tolerante al contexto vm de Jest.
- `npm test` → `jest`; `npm run test:cobertura` → `jest --coverage`. CI: cobertura y reporte Bruno como artefactos.
- Contrato OpenAPI idéntico con tsx y con SWC: parámetros de ruta declarados siempre y sin cabeceras duplicadas.

## Carga

- `docs/06-pruebas-atributos-calidad/scripts/carga.k6.js`: perfil `PERFIL=2000` (escalones de 120 s: 30 s de subida y 90 s estables).
- `.github/workflows/carga.yml`: a pedido o con ramas `carga/**`; dos trabajos en máquinas separadas (caché 0 y 30 s); PostgreSQL, datos sintéticos, API compilada y k6 2.4.0 en Docker; artefactos con resumen, `recursos.csv` y entorno.
