# Tareas — Información legal y Libro de Reclamaciones

Estado: etapa 1 implementada (2026-11-16); etapa 2 pendiente.

## Etapa 1

- [x] T001 Migración backend/migrations/resenas/004-libro-reclamaciones.sql y su .down; registrarla en scripts/migraciones.ts.
- [x] T002 [US1] Dominio, repositorio y rutas públicas del libro en el módulo resenas; cuota por la fachada de usuarios.
- [x] T003 [US2] Consulta pública con número y código de consulta.
- [x] T004 [US3] Atención en /admin/reclamaciones con respuesta única.
- [x] T005 [US4] Páginas de términos, devoluciones, privacidad y contacto; columna legal en el pie.
- [x] T006 Pruebas: backend/test/resenas/reclamaciones.test.ts y frontend/tests/resenas/reclamaciones.spec.ts; registrar en quickstart.md.
- [ ] T007 Configurar los datos reales del titular (QATU_TITULAR_*) y revisar los textos legales con asesoría antes de producción (D-012-1).

## Etapa 2

- [ ] T008 Envío automático de la constancia y de la respuesta por correo.
- [ ] T009 Suspensión del plazo por ofrecimiento de solución.
- [ ] T010 Aviso de hojas por vencer, exportación y calendario de feriados.
