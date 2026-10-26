# Tareas — Catálogo y publicaciones

Estado (2026-10-26): publicación, edición, catálogo persistido y moderación implementados y verificados localmente. D04 resuelta técnicamente. T023 cerrada con el ensayo local de Catálogo; T027 sigue abierta para el escenario global con Reservas/VPS (005/008). No se declara aceptación global del MVP. Evidencias en cierre.md.

## Fase 1 — Preparación

- [x] T001 Resolver las decisiones afectadas en specs/004-catalogo-publicaciones/research.md; sincronizar ADR/contratos si cambian.
- [x] T002 Completar DTO/estados y matriz de permisos en specs/004-catalogo-publicaciones/contracts/api.md.

## Fase 2 — Fundaciones

- [x] T003 Crear entidades/valores y puertos en backend/src/modules/catalogo/dominio/ según data-model.md.
- [x] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/catalogo/ y backend/src/modules/catalogo/infraestructura/.
- [x] T005 Conectar fachada, adapters y composición en backend/src/modules/catalogo/catalogo.module.ts; sin imports cíclicos.

## Fase 3 — US1: Gestionar oferta

Objetivo y prueba independiente: dado un proveedor verificado, creo herramienta o servicio con tarifa y recurso; se guarda una oferta propia coherente.

- [x] T006 [US1] Implementar el caso «Gestionar oferta» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T007 [US1] Exponer DTO y controlador del caso «Gestionar oferta» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [x] T008 [US1] Integrar el recorrido «Gestionar oferta» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [x] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Gestionar oferta» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Fase 4 — US2: Explorar catálogo

Objetivo y prueba independiente: dado ofertas activas e inactivas, aplico filtros y abro detalle; solo se muestran las activas y el precio conserva su unidad.

- [x] T010 [US2] Implementar el caso «Explorar catálogo» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T011 [US2] Exponer DTO y controlador del caso «Explorar catálogo» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [x] T012 [US2] Integrar el recorrido «Explorar catálogo» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [x] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Explorar catálogo» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Fase 5 — US3: Moderar publicación

Objetivo y prueba independiente: dado una publicación denunciada o revisada, la desactivo con motivo; deja de aparecer sin borrar historial de reservas.

- [x] T014 [US3] Implementar el caso «Moderar publicación» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T015 [US3] Exponer DTO y controlador del caso «Moderar publicación» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [x] T016 [US3] Integrar el recorrido «Moderar publicación» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [x] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Moderar publicación» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [x] T018 Definir D04 y validar campos públicos/privados; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [x] T019 Crear publicación/categoría/recurso/tarifa con índices; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [x] T020 Implementar alta/edición/desactivación y moderación; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [x] T021 Implementar ConsultaCatalogo y lectura REST paginada; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [x] T022 Conectar la interfaz de entrega 001 y editor de publicaciones; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [x] T023 Verificar permisos, filtros persistidos y carga local de Catálogo derivada de EQ-01/EQ-03 según protocolo-carga.md; la aceptación global permanece en T027. Evidencia en cierre.md.

## Cierre y verificación crítica

- [x] T024 Proveedor no verificado y edición ajena rechazados. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [x] T025 Datos persistidos: filtro tipo/categoría/zona/precio, límite 20 y orden estable sin duplicados. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [x] T026 Desactivar entre listado/detalle, recurso multiu­nidad y precio inválido. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [ ] T027 Ensayo global EQ-01/EQ-03 con 5000 reservas, mezcla 70/20/10 y entorno objetivo; seguimiento en 005/008. El ensayo local de Catálogo está aprobado, sin sustituir esta aceptación global.
- [x] T028 Analizar consistencia e imports y registrar resultados/limitaciones en specs/004-catalogo-publicaciones/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 003-proveedores-verificacion. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
