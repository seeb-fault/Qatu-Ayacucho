# Tareas — VPS y aceptación

## Preparación

- [ ] T001 Registrar host/dominio/presupuesto, destino y retención en specs/008-despliegue-validacion/research.md.
- [ ] T002 Preparar CI y versiones de imágenes en .github/workflows/ci.yml, frontend/Dockerfile y backend/Dockerfile.

## US1 Publicar

- [ ] T003 [US1] Implementar servicios/red/volúmenes/health en infra/compose.yml e infra/compose.production.yml.
- [ ] T004 [US1] Configurar HTTPS y rutas en infra/proxy/; comprobar PostgreSQL privado.
- [ ] T005 [US1] Documentar migraciones compatibles, smoke y rollback en infra/runbooks/despliegue.md.

## US2 Recuperar

- [ ] T006 [US2] Implementar copias externas cifradas DB/archivos y comprobación de hashes en infra/backup/.
- [ ] T007 [US2] Ensayar restore vacío y conciliación posterior a backup; registrar RPO/RTO en infra/runbooks/restauracion.md.

## US3 Observar

- [ ] T008 [US3] Implementar logs/health y señales de pagos desconocidos/backups en backend/src/observabilidad/.
- [ ] T009 [US3] Ejecutar EQ-01/03/09 y regresión EQ-04/07/08; conservar resultados en specs/008-despliegue-validacion/quickstart.md.

## Cierre

- [ ] T010 Revisar coherencia código/contratos/specs y actualizar docs/03-diseño-de-software/validacion-del-diseno.md con evidencias reales.

Dependencias: T001–T002 antes de publicación; Compose puede prepararse junto a primeras entregas. US2 exige copias disponibles y entorno aislado. La aceptación integrada espera módulos 002–007 y recorrido 001. No ejecutar restauración destructiva sobre producción para probar el runbook.
