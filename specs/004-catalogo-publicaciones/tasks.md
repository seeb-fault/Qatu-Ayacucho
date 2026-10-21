# Tareas — Catálogo y publicaciones

Estado: pendiente. Alcance documental; ninguna tarea de código se ha ejecutado.

## Fase 1 — Preparación

- [ ] T001 Resolver las decisiones afectadas en specs/004-catalogo-publicaciones/research.md; sincronizar ADR/contratos si cambian.
- [ ] T002 Completar DTO/estados y matriz de permisos en specs/004-catalogo-publicaciones/contracts/api.md.

## Fase 2 — Fundaciones

- [ ] T003 Crear entidades/valores y puertos en backend/src/modules/catalogo/dominio/ según data-model.md.
- [ ] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/catalogo/ y backend/src/modules/catalogo/infraestructura/.
- [ ] T005 Conectar fachada, adapters y composición en backend/src/modules/catalogo/catalogo.module.ts; sin imports cíclicos.

## Fase 3 — US1: Gestionar oferta

Objetivo y prueba independiente: dado un proveedor verificado, creo herramienta o servicio con tarifa y recurso; se guarda una oferta propia coherente.

- [ ] T006 [US1] Implementar el caso «Gestionar oferta» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T007 [US1] Exponer DTO y controlador del caso «Gestionar oferta» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [ ] T008 [US1] Integrar el recorrido «Gestionar oferta» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [ ] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Gestionar oferta» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Fase 4 — US2: Explorar catálogo

Objetivo y prueba independiente: dado ofertas activas e inactivas, aplico filtros y abro detalle; solo se muestran las activas y el precio conserva su unidad.

- [ ] T010 [US2] Implementar el caso «Explorar catálogo» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T011 [US2] Exponer DTO y controlador del caso «Explorar catálogo» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [ ] T012 [US2] Integrar el recorrido «Explorar catálogo» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [ ] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Explorar catálogo» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Fase 5 — US3: Moderar publicación

Objetivo y prueba independiente: dado una publicación denunciada o revisada, la desactivo con motivo; deja de aparecer sin borrar historial de reservas.

- [ ] T014 [US3] Implementar el caso «Moderar publicación» con autorización/transiciones en backend/src/modules/catalogo/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T015 [US3] Exponer DTO y controlador del caso «Moderar publicación» en backend/src/modules/catalogo/presentacion/ según contracts/api.md.
- [ ] T016 [US3] Integrar el recorrido «Moderar publicación» y sus estados negativos en frontend/src/components/catalogo/ y frontend/src/app/.
- [ ] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Moderar publicación» en backend/test/catalogo/ y frontend/tests/catalogo/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [ ] T018 Definir D04 y validar campos públicos/privados; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [ ] T019 Crear publicación/categoría/recurso/tarifa con índices; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [ ] T020 Implementar alta/edición/desactivación y moderación; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [ ] T021 Implementar ConsultaCatalogo y lectura REST paginada; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [ ] T022 Conectar la interfaz de entrega 001 y editor de publicaciones; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.
- [ ] T023 Verificar permisos, filtros persistidos y carga EQ-01/EQ-03; archivos previstos en backend/src/modules/catalogo/ o frontend/src/components/catalogo/ según plan.md.

## Cierre y verificación crítica

- [ ] T024 Proveedor no verificado y edición ajena rechazados. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [ ] T025 Datos persistidos: filtro tipo/categoría/zona/precio, límite 20 y orden estable sin duplicados. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [ ] T026 Desactivar entre listado/detalle, recurso multiu­nidad y precio inválido. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [ ] T027 EQ-01 y EQ-03 con dataset/condiciones del documento; no reportar cumplimiento antes de medir. Registrar evidencia en specs/004-catalogo-publicaciones/quickstart.md.
- [ ] T028 Analizar consistencia e imports y registrar resultados/limitaciones en specs/004-catalogo-publicaciones/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 003-proveedores-verificacion. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
