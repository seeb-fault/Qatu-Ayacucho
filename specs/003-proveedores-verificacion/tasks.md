# Tareas — Proveedores y verificación

Estado (2026-10-19): perfiles, consulta pública optativa y revisión documental implementados localmente con persistencia/cifrado. D03 documental resuelta por el usuario; quedan D02, mapas externos y habilitación de Catálogo. T018/T021/T026 continúan abiertas por esas partes; no se declara la aceptación completa del MVP ni de calidad global.

## Fase 1 — Preparación

- [x] T001 Resolver las decisiones afectadas en specs/003-proveedores-verificacion/research.md; sincronizar ADR/contratos si cambian.
- [x] T002 Completar DTO/estados y matriz de permisos en specs/003-proveedores-verificacion/contracts/api.md.

## Fase 2 — Fundaciones

- [x] T003 Crear entidades/valores y puertos en backend/src/modules/proveedores/dominio/ según data-model.md.
- [x] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/proveedores/ y backend/src/modules/proveedores/infraestructura/.
- [x] T005 Conectar fachada, adapters y composición en backend/src/modules/proveedores/proveedores.module.ts; sin imports cíclicos.

## Fase 3 — US1: Crear perfil

Objetivo y prueba independiente: dado una cuenta activa, completo perfil y distrito; se registra un perfil propio sin duplicarlo.

- [x] T006 [US1] Implementar el caso «Crear perfil» con autorización/transiciones en backend/src/modules/proveedores/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T007 [US1] Exponer DTO y controlador del caso «Crear perfil» en backend/src/modules/proveedores/presentacion/ según contracts/api.md.
- [x] T008 [US1] Integrar el recorrido «Crear perfil» y sus estados negativos en frontend/src/components/proveedores/ y frontend/src/app/.
- [x] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Crear perfil» en backend/test/proveedores/ y frontend/tests/proveedores/; registrar resultado en quickstart.md.

## Fase 4 — US2: Verificar proveedor

Objetivo y prueba independiente: dado documentos privados remitidos, apruebo o rechazo con motivo; el resultado queda auditado y solo una aprobación válida habilita publicación.

- [x] T010 [US2] Implementar el caso «Verificar proveedor» con autorización/transiciones en backend/src/modules/proveedores/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T011 [US2] Exponer DTO y controlador del caso «Verificar proveedor» en backend/src/modules/proveedores/presentacion/ según contracts/api.md.
- [x] T012 [US2] Integrar el recorrido «Verificar proveedor» y sus estados negativos en frontend/src/components/proveedores/ y frontend/src/app/.
- [x] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Verificar proveedor» en backend/test/proveedores/ y frontend/tests/proveedores/; registrar resultado en quickstart.md.

## Fase 5 — US3: Consultar oferta local

Objetivo y prueba independiente: dado un perfil visible, consulto sus datos; veo información pública y estado real, nunca documentos privados.

- [x] T014 [US3] Implementar el caso «Consultar oferta local» con autorización/transiciones en backend/src/modules/proveedores/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T015 [US3] Exponer DTO y controlador del caso «Consultar oferta local» en backend/src/modules/proveedores/presentacion/ según contracts/api.md.
- [x] T016 [US3] Integrar el recorrido «Consultar oferta local» y sus estados negativos en frontend/src/components/proveedores/ y frontend/src/app/.
- [x] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Consultar oferta local» en backend/test/proveedores/ y frontend/tests/proveedores/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [ ] T018 Precisar estados de verificación y política D02/D03; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.
- [x] T019 Crear perfil/verificación y unicidad por usuario; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.
- [x] T020 Implementar revisión administrativa y auditoría; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.
- [ ] T021 Implementar fachada pública y adapter de mapas con zona manual; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.
- [x] T022 Integrar panel proveedor y cola de verificación; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.
- [x] T023 Probar documentos privados y rechazo de autoaprobación; archivos previstos en backend/src/modules/proveedores/ o frontend/src/components/proveedores/ según plan.md.

## Cierre y verificación crítica

- [x] T024 Perfil duplicado y usuario inexistente/inactivo. Registrar evidencia en specs/003-proveedores-verificacion/quickstart.md.
- [x] T025 Acceso a documento propio, ajeno y administrativo; URL no pública. Registrar evidencia en specs/003-proveedores-verificacion/quickstart.md.
- [ ] T026 Fallo de mapas conserva selección manual; estado de verificación no modificable por cliente. Registrar evidencia en specs/003-proveedores-verificacion/quickstart.md.
- [x] T027 Analizar consistencia e imports y registrar resultados/limitaciones en specs/003-proveedores-verificacion/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 002-usuarios-acceso. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
