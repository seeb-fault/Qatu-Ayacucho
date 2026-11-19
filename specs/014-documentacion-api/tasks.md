# Tareas — Documentación y pruebas de contrato de la API

Estado: etapa 1 implementada (2026-11-19); etapa 2 pendiente.

## Etapa 1

- [x] T001 Agregar @nestjs/swagger 11.4.8; corregir de paso las vulnerabilidades de multer y body-parser (npm audit fix).
- [x] T002 Decorador @Doc y atajos de esquemas en backend/src/shared/presentacion/openapi.ts.
- [x] T003 Documento y página en backend/src/shared/infraestructura/documentacion-api.ts; publicarla desde app.ts según QATU_DOCS.
- [x] T004 [US1] Documentar los 94 endpoints: Salud, Usuarios, Proveedores, Catálogo, Reservas, Mi lista, Avisos, Pagos, Reseñas, Evidencias, Incidencias, Libro de Reclamaciones y Administración.
- [x] T005 [US3] Script npm run openapi y contrato versionado en docs/03-diseño-de-software/diseño-externo/openapi.json.
- [x] T006 [US3] Pruebas en backend/test/compartido/openapi.test.ts.
- [x] T007 [US1] QATU_DOCS en backend/.env.example, infra/compose.production.yml e infra/runbooks/despliegue.md.
- [ ] T008 [US2] Recorrido manual por el frontend: login y una operación con sesión desde la página.

## Etapa 2

- [ ] T009 Colección Bruno importada del contrato, con flujos y aserciones de negocio.
- [ ] T010 Ejecutar Bruno en el CI y guardar el reporte HTML como artefacto.
