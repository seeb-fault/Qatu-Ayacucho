# Tareas — Coordinación por WhatsApp

Estado: etapa 1 implementada (2026-11-15); etapa 2 pendiente. El recorrido de navegador corre en CI.

## Etapa 1

- [x] T001 Migración backend/migrations/usuarios/003-whatsapp.sql y su .down; registrarla en scripts/migraciones.ts.
- [x] T002 [US1] Validación, lectura y edición del WhatsApp y su consentimiento en el módulo usuarios.
- [x] T003 [US2] Estados que comparten contacto en backend/src/modules/reservas/dominio/coordinacion.ts y ruta GET /reservas/:id/contacto.
- [x] T004 [US3] Requisito de WhatsApp visible al publicar en backend/src/modules/catalogo/aplicacion/catalogo.ts; ajustar las pruebas que publican.
- [x] T005 [US1] Campo WhatsApp y consentimiento en frontend/src/components/usuarios/Perfil.tsx.
- [x] T006 [US2] frontend/src/components/reservas/CoordinarWhatsapp.tsx en la tarjeta de la reserva; retirar el enlace anterior sin destinatario.
- [x] T007 Pruebas: backend/test/reservas/whatsapp.test.ts y frontend/tests/reservas/whatsapp.spec.ts; registrar en quickstart.md.

## Etapa 2

- [ ] T008 Decidir proveedor, presupuesto y verificación de negocio (D08).
- [ ] T009 Adaptador de WhatsApp Business para el puerto Notificador con plantillas aprobadas.
