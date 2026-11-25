# Tareas — Documentación y pruebas de contrato de la API

Estado: etapas 1 (2026-11-19) y 2 (2026-11-25) implementadas.

## Etapa 1

- [x] T001 Agregar @nestjs/swagger 11.4.8; corregir de paso las vulnerabilidades de multer y body-parser (npm audit fix).
- [x] T002 Decorador @Doc y atajos de esquemas en backend/src/shared/presentacion/openapi.ts.
- [x] T003 Documento y página en backend/src/shared/infraestructura/documentacion-api.ts; publicarla desde app.ts según QATU_DOCS.
- [x] T004 [US1] Documentar los 94 endpoints: Salud, Usuarios, Proveedores, Catálogo, Reservas, Mi lista, Avisos, Pagos, Reseñas, Evidencias, Incidencias, Libro de Reclamaciones y Administración.
- [x] T005 [US3] Script npm run openapi y contrato versionado en docs/03-diseño-de-software/diseño-externo/openapi.json.
- [x] T006 [US3] Pruebas en backend/test/compartido/openapi.test.ts.
- [x] T007 [US1] QATU_DOCS en backend/.env.example, infra/compose.production.yml e infra/runbooks/despliegue.md.
- [ ] T008 [US2] Recorrido manual por el frontend: login y una operación con sesión desde la página (lo hace el equipo con los servidores de desarrollo).

## Etapa 2

- [x] T009 Colección Bruno con flujos y aserciones de negocio: salud y contrato, usuarios y sesión, catálogo, reservas y Libro de Reclamaciones.
- [x] T010 Ejecutar Bruno en el CI (docs/06-pruebas-atributos-calidad/scripts/bruno.mjs) y guardar el reporte HTML como artefacto.
