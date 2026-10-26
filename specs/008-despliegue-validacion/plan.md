# Plan — VPS y aceptación

## Technical Context y Constitution Check

Docker Compose: proxy, frontend Next.js, API NestJS, PostgreSQL/PostGIS; archivos persistentes y copias fuera del host. No añadir Kubernetes ni prometer alta disponibilidad. Puerto público 443, 80 para redirección/certificados, SSH restringido. Registrar dimensionamiento con EQ, no cifras arbitrarias.

## Estructura prevista

infra/compose.yml; infra/compose.production.yml; infra/proxy/; infra/backup/; infra/runbooks/; frontend/Dockerfile; backend/Dockerfile; .github/workflows/ci.yml. No existen todavía y pertenecen a implementación.

## Fases

Construir y probar imágenes → definir health/secrets/red/volúmenes → copias y restore aislado → medición EQ → publicación y smoke → rollback ensayado. Migraciones y rollback deben considerar esquema, no solo imagen. Restauración incluye conciliación de pagos posteriores al backup.

## Bloqueos

Publicación depende de dominio/host y presupuesto elegidos. Integración final depende de sandbox, mensajes y mapas reales según RC04–RC06. Falta de credenciales queda bloqueante, no se sustituye por simulación silenciosa.

[Validación](./quickstart.md).

## Evidencia transversal pendiente de 004

Repetir el ensayo global EQ-01/EQ-03 en el VPS con el módulo de Reservas implementado: 100 proveedores, 1000 publicaciones, 5000 reservas, mezcla 70/20/10, calentamiento y carga definidos por los escenarios fuente. La medición local aislada de Catálogo 004 no sustituye ese ensayo. Conservar pendientes la revisión humana independiente y EQ-06 con cinco participantes, sin inferirlas de capturas o E2E automatizadas.
