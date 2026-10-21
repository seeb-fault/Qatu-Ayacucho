# Tareas — Usuarios y acceso

Estado (2026-10-19): US1/US2/US3 implementadas y verificadas con PostgreSQL real y Chrome. Tareas de implementación local completas; OpenAPI estructurado, aceptación global de EQ-04/EQ-05 y revisión humana siguen pendientes en checklist. Las guardas de autorización viven en los casos de uso y se repiten dentro de la transacción administrativa; no se confía en ocultar controles web.

## Fase 1 — Preparación

- [x] T001 Resolver las decisiones afectadas en specs/002-usuarios-acceso/research.md; sincronizar ADR/contratos si cambian.
- [x] T002 Completar DTO/estados y matriz de permisos en specs/002-usuarios-acceso/contracts/api.md.

## Fase 2 — Fundaciones

- [x] T003 Crear entidades/valores y puertos en backend/src/modules/usuarios/dominio/ según data-model.md.
- [x] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/usuarios/ y backend/src/modules/usuarios/infraestructura/.
- [x] T005 Conectar fachada, adapters y composición en backend/src/modules/usuarios/usuarios.module.ts; sin imports cíclicos.

## Fase 3 — US1: Registrarse e ingresar

Objetivo y prueba independiente: dado email válido sin registrar, completo el registro; se crea una sola cuenta y no se expone el hash.

- [x] T006 [US1] Implementar el caso «Registrarse e ingresar» con autorización/transiciones en backend/src/modules/usuarios/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T007 [US1] Exponer DTO y controlador del caso «Registrarse e ingresar» en backend/src/modules/usuarios/presentacion/ según contracts/api.md.
- [x] T008 [US1] Integrar el recorrido «Registrarse e ingresar» y sus estados negativos en frontend/src/components/usuarios/ y frontend/src/app/.
- [x] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Registrarse e ingresar» en backend/test/usuarios/ y frontend/tests/usuarios/; registrar resultado en quickstart.md.

## Fase 4 — US2: Gestionar cuenta propia

Objetivo y prueba independiente: dado una sesión válida, edito mi perfil; solo cambian mis datos permitidos.

- [x] T010 [US2] Implementar el caso «Gestionar cuenta propia» con autorización/transiciones en backend/src/modules/usuarios/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T011 [US2] Exponer DTO y controlador del caso «Gestionar cuenta propia» en backend/src/modules/usuarios/presentacion/ según contracts/api.md.
- [x] T012 [US2] Integrar el recorrido «Gestionar cuenta propia» y sus estados negativos en frontend/src/components/usuarios/ y frontend/src/app/.
- [x] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Gestionar cuenta propia» en backend/test/usuarios/ y frontend/tests/usuarios/; registrar resultado en quickstart.md.

## Fase 5 — US3: Administrar usuarios

Objetivo y prueba independiente: dado un administrador autorizado, desactiva una cuenta; el acceso se revoca según política de sesión y se audita la acción.

- [x] T014 [US3] Implementar el caso «Administrar usuarios» con autorización/transiciones en backend/src/modules/usuarios/aplicacion/; cumplir los FR aplicables de spec.md.
- [x] T015 [US3] Exponer DTO y controlador del caso «Administrar usuarios» en backend/src/modules/usuarios/presentacion/ según contracts/api.md.
- [x] T016 [US3] Integrar el recorrido «Administrar usuarios» y sus estados negativos en frontend/src/components/usuarios/ y frontend/src/app/.
- [x] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Administrar usuarios» en backend/test/usuarios/ y frontend/tests/usuarios/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [x] T018 Definir matriz de permisos y decisión D01 de sesión; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.
- [x] T019 Implementar entidades Usuario/Roles y migraciones de unicidad; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.
- [x] T020 Implementar registro/login y hash mediante adapter; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.
- [x] T021 Implementar guardas, IdentidadUsuarios y casos de perfil/admin; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.
- [x] T022 Integrar pantallas de acceso/perfil y estados de error; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.
- [x] T023 Verificar autorización, concurrencia de registro e invalidez de sesión; archivos previstos en backend/src/modules/usuarios/ o frontend/src/components/usuarios/ según plan.md.

## Cierre y verificación crítica

- [x] T024 Email duplicado normalizado y dos registros concurrentes: una sola cuenta. Registrar evidencia en specs/002-usuarios-acceso/quickstart.md.
- [x] T025 Matriz cliente/proveedor/admin/anónimo: acciones ajenas rechazadas, incluso con IDs manipulados. Registrar evidencia en specs/002-usuarios-acceso/quickstart.md.
- [x] T026 Contraseña incorrecta, cuenta inactiva y límite de intentos; sin credenciales en logs. Registrar evidencia en specs/002-usuarios-acceso/quickstart.md.
- [x] T027 Analizar consistencia e imports y registrar resultados/limitaciones en specs/002-usuarios-acceso/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: arranque técnico e identidad base. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
