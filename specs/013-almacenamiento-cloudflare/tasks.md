# Tareas — Almacenamiento y borde con Cloudflare

Estado: etapa 1 implementada (2026-11-16); etapas 2 y 3 pendientes.

## Etapa 1

- [x] T001 Almacén compartido: interfaz, R2 con SigV4, memoria y elección por QATU_ALMACEN.
- [x] T002 Migraciones compartido/001-objetos-por-borrar, proveedores/003-almacen-objetos y resenas/005-almacen-objetos con sus .down; registrarlas en scripts/migraciones.ts.
- [x] T003 [US1] Documentos de proveedores y evidencias se suben a R2; lectura desde donde esté el archivo.
- [x] T004 [US2] Retención y purga encolan el objeto en la misma transacción; la cola se vacía con reintentos.
- [x] T005 [US3] Script archivos:mover y verificador de restauración con almacén.
- [x] T006 Pruebas: backend/test/almacen/almacen.test.ts (memoria y R2 real), entorno de pruebas sin R2 y suites de navegador con QATU_ALMACEN=memoria; registrar en quickstart.md.
- [x] T007 Política de privacidad: Cloudflare como encargado y transferencia internacional.
- [ ] T008 Activar QATU_ALMACEN=r2 en desarrollo y mover los archivos existentes (con copia previa de la base).
- [ ] T009 Buckets y token de producción; verificación en dos pasos y alerta de presupuesto en Cloudflare.

## Etapa 2

- [ ] T010 Fotos de publicaciones en el bucket público con dominio propio y CDN.

## Etapa 3

- [ ] T011 Cloudflare delante de Traefik: SSL Full (strict), WAF, IP real con los rangos de Cloudflare y Turnstile.
