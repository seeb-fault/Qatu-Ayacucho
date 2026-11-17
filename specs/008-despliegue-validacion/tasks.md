# Tareas — VPS y aceptación

## Preparación

- [x] T001 Registrar host/dominio/presupuesto, destino y retención en specs/008-despliegue-validacion/research.md. Registrado (2026-11-16): AWS EC2 con Dokploy, qatu.devpe.tech, copias en R2.
- [ ] T002 Preparar CI y versiones de imágenes en .github/workflows/ci.yml, frontend/Dockerfile y backend/Dockerfile. Dockerfiles listos y probados en local; falta construirlos en CI.

## US1 Publicar

- [x] T003 [US1] Implementar servicios/red/volúmenes/health en infra/compose.yml e infra/compose.production.yml. Hecho en infra/compose.production.yml para Dokploy (compose.yaml de la raíz sigue siendo el de desarrollo).
- [ ] T004 [US1] Configurar HTTPS y rutas en infra/proxy/; comprobar PostgreSQL privado. HTTPS y rutas con Traefik de Dokploy en lugar de infra/proxy/; PostgreSQL sin puertos publicados. Falta comprobarlo en la EC2.
- [x] T005 [US1] Documentar migraciones compatibles, smoke y rollback en infra/runbooks/despliegue.md. Guía paso a paso; las migraciones se aplican al arrancar la API.

## US2 Recuperar

- [ ] T006 [US2] Implementar copias externas cifradas DB/archivos y comprobación de hashes en infra/backup/.
- [ ] T007 [US2] Ensayar restore vacío y conciliación posterior a backup; registrar RPO/RTO en infra/runbooks/restauracion.md.

## US3 Observar

- [ ] T008 [US3] Implementar logs/health y señales de pagos desconocidos/backups en backend/src/observabilidad/. Salud lista: GET /api/v1/salud (base) y /api/v1/salud/vida; faltan alertas.
- [ ] T009 [US3] Ejecutar EQ-01/03/09 y regresión EQ-04/07/08; conservar resultados en specs/008-despliegue-validacion/quickstart.md.

## Cierre

- [ ] T010 Revisar coherencia código/contratos/specs y actualizar docs/03-diseño-de-software/validacion-del-diseno.md con evidencias reales.

Dependencias: T001–T002 antes de publicación; Compose puede prepararse junto a primeras entregas. US2 exige copias disponibles y entorno aislado. La aceptación integrada espera módulos 002–007 y recorrido 001. No ejecutar restauración destructiva sobre producción para probar el runbook.
