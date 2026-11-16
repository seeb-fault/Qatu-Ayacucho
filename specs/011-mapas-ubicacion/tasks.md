# Tareas — Mapas y ubicación

Estado: etapa 1 implementada (2026-11-15); etapa 2 pendiente. El recorrido de navegador corre en CI.

## Etapa 1

- [x] T001 Migración backend/migrations/catalogo/002-ubicaciones.sql y su .down; registrarla en scripts/migraciones.ts.
- [x] T002 [US1] Dominio de ubicación, repositorio y rutas del dueño en el módulo catálogo.
- [x] T003 [US2] Punto público en las respuestas de catálogo; mapa en el detalle y en los resultados.
- [x] T004 [US3] Punto exacto en GET /reservas/:id/contacto y mapa con «Abrir en Google Maps» en la tarjeta.
- [x] T005 [US1] Editor con mapa, «Usar mi ubicación» y elección exacta o casi exacta.
- [x] T006 Pruebas: backend/test/catalogo/ubicacion.test.ts y frontend/tests/reservas/mapa.spec.ts; registrar en quickstart.md.

## Etapa 2

- [ ] T007 Lugar del trabajo marcado por el cliente en los oficios.
- [ ] T008 «Cerca de ti» y orden por distancia.
