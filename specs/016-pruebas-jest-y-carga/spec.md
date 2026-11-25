# 016 — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

**Estado:** etapa 1 (016.1) implementada. **Fecha:** 2026-11-25.
**Módulos técnicos:** pruebas del backend, CI (GitHub Actions) y pruebas de atributos de calidad. **Historias:** requisitos del Sprint 2, actividades 7 y 8, y entregable «Pruebas automatizadas con Jest y reporte de cobertura».

## Objetivo y alcance

- **Jest:** ejecutar todas las pruebas del backend (unitarias de dominio e integración con PostgreSQL real) con Jest, con reporte de cobertura, en cada cambio mediante GitHub Actions.
- **Carga:** simular de forma progresiva hasta 2 000 usuarios virtuales concurrentes con k6 sobre los escenarios EQ-01 y EQ-03 del Sprint 1, y registrar si se cumplen las metas de AC01 (rendimiento) y AC03 (escalabilidad).
- **Fuera de alcance:** las pruebas de navegador siguen con Playwright (especificado en specs anteriores); la medición sobre el servidor de producción depende de la spec 008.

## User Scenarios & Testing

### US1 — Las reglas de negocio se prueban en cada cambio (P1)

**Prueba independiente:** Dado un push a cualquier rama, cuando corre el CI, entonces `npm run test:cobertura` (Jest) ejecuta las 32 suites del backend contra PostgreSQL y publica el reporte de cobertura como artefacto; si una regla falla, el CI falla.
**Caso negativo:** una prueba que compara objetos iguales provenientes de otro contexto (fetch) no debe fallar por el prototipo: lo evita `test/assert-jest.ts`.

### US2 — Saber hasta cuántos usuarios responde (P1)

**Prueba independiente:** Dado el workflow «Carga k6», cuando corre, entonces sube por escalones de 100, 250, 500, 1 000, 1 500 y 2 000 usuarios, mide p95 y errores por escalón, y guarda el resumen, el uso de CPU y memoria y el entorno como artefacto.

## Requisitos

- **M016-FR01:** `npm test` y `npm run test:cobertura` usan Jest 30 con SWC; una suite a la vez (comparten base y puertos).
- **M016-FR02:** Cobertura de `src/` (sin `main.ts`) con proveedor V8; reportes texto, HTML, LCOV y resumen JSON.
- **M016-FR03:** Las pruebas de integración preparan una vez la base, la API y las cuentas y recorren casos en orden con `caso(nombre, cuerpo)`; un fallo indica el caso.
- **M016-FR04:** El perfil k6 `PERFIL=2000` mide cada escalón por separado; metas: p95 ≤ 1 s hasta 500 usuarios (AC01/AC03) y ≤ 2 s por encima, con errores < 1 %.

## Criterios de aceptación

- **AC01:** Las 32 suites pasan con Jest en una base `_test` nueva; cobertura registrada en quickstart.md.
- **AC02:** El job «Backend e integración PostgreSQL» del CI corre Jest con cobertura y Bruno, y guarda ambos reportes.
- **AC03:** El resultado de k6 hasta 2 000 usuarios (sin caché y con caché) está registrado con su entorno, cumpla o no las metas.
