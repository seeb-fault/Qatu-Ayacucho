# Tareas — Mi lista

Estado: etapa 1 implementada (2026-11-15). El recorrido de navegador corre en CI.

## Fase 1 — Preparación

- [x] T001 Confirmar el límite de ítems y la retención de fechas vencidas en specs/009-mi-lista/research.md.

## Fase 2 — Fundaciones

- [x] T002 Crear la migración backend/migrations/reservas/011-lista.sql (y su .down) con restricciones e índices de data-model.md; añadirla a scripts/migraciones.ts.
- [x] T003 Crear dominio, puerto y repositorio en backend/src/modules/reservas/dominio/lista.ts e infraestructura/postgres-lista.ts.

## Fase 3 — US1: Guardar en mi lista

- [x] T004 [US1] Caso de uso agregar/listar/quitar en backend/src/modules/reservas/aplicacion/lista.ts con revalidación por lote.
- [x] T005 [US1] Controlador y rutas en backend/src/modules/reservas/presentacion/lista.controller.ts según contracts/api.md.
- [x] T006 [US1] Botón «Agregar a mi lista», contador en el encabezado y página frontend/src/app/lista/page.tsx agrupada por proveedor.
- [x] T007 [US1] Pruebas: backend/test/reservas/lista.test.ts (propia publicación 403, duplicado y límite 409, lista ajena 404) y recorrido en frontend/tests/reservas/lista.spec.ts.

## Fase 4 — US2: Ingresar y volver

- [x] T008 [US2] Helper de ruta interna segura y soporte de `?siguiente=` en frontend/src/components/usuarios/Acceso.tsx, con la intención pendiente en sessionStorage.
- [x] T009 [US2] Pruebas de regreso válido y de rutas maliciosas (`//`, `/\`, `https://`).

## Fase 5 — US3: Enviar la lista

- [x] T010 [US3] Envío con `Idempotency-Key`, cada ítem sale de la lista antes de crear su solicitud y vuelve con el motivo si se rechaza.
- [x] T011 [US3] Resultado por ítem en la página y pruebas de envío parcial, repetido y concurrente.

## Fase 6 — US4 y cierre

- [x] T012 [US4] Estados `tarifa_cambiada`, `fechas_vencidas`, `no_disponible` e `inactiva` con su corrección en pantalla.
- [x] T013 Registrar evidencias en quickstart.md, actualizar specs/README.md y el validador de entrega.
