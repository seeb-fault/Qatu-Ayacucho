# Tareas — Comportamiento de la base de datos y estrategia de caché

Estado: etapa 1 implementada (2026-11-25).

- [x] T001 [US1] Analizador de planes en backend/scripts/analizar-base.ts (npm run base:analizar) y resultados en docs/06-pruebas-atributos-calidad/base-de-datos/.
- [x] T002 [US1] Optimizar PostgresReservas.listar para usar el índice por cuenta y armar solo la página.
- [x] T003 [US2] CacheMemoria con TTL, LRU y lectura compartida en backend/src/shared/infraestructura/cache.ts.
- [x] T004 [US2] Decoradores de caché del catálogo e inyección en catalogo.module.ts; Reservas sin caché.
- [x] T005 [US2] Cabeceras Cache-Control en lecturas públicas y no-store en errores (filtro global).
- [x] T006 Pruebas en backend/test/catalogo/cache.test.ts.
- [x] T007 QATU_CACHE_SEGUNDOS en backend/.env.example, infra/compose.production.yml e infra/runbooks/despliegue.md.
- [ ] T008 [US2] Medir con k6 (2 000 usuarios) sin caché y con caché, y registrar la comparación.
