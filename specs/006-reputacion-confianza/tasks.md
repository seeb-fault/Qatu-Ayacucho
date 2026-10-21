# Tareas — Reputación y confianza

Estado: pendiente. Alcance documental; ninguna tarea de código se ha ejecutado.

## Fase 1 — Preparación

- [ ] T001 Resolver las decisiones afectadas en specs/006-reputacion-confianza/research.md; sincronizar ADR/contratos si cambian.
- [ ] T002 Completar DTO/estados y matriz de permisos en specs/006-reputacion-confianza/contracts/api.md.

## Fase 2 — Fundaciones

- [ ] T003 Crear entidades/valores y puertos en backend/src/modules/resenas/dominio/ según data-model.md.
- [ ] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/resenas/ y backend/src/modules/resenas/infraestructura/.
- [ ] T005 Conectar fachada, adapters y composición en backend/src/modules/resenas/resenas.module.ts; sin imports cíclicos.

## Fase 3 — US1: Registrar evidencia

Objetivo y prueba independiente: dado mi reserva en etapa permitida, subo evidencia válida; se guarda privada con metadata y solo los autorizados la descargan.

- [ ] T006 [US1] Implementar el caso «Registrar evidencia» con autorización/transiciones en backend/src/modules/resenas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T007 [US1] Exponer DTO y controlador del caso «Registrar evidencia» en backend/src/modules/resenas/presentacion/ según contracts/api.md.
- [ ] T008 [US1] Integrar el recorrido «Registrar evidencia» y sus estados negativos en frontend/src/components/resenas/ y frontend/src/app/.
- [ ] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Registrar evidencia» en backend/test/resenas/ y frontend/tests/resenas/; registrar resultado en quickstart.md.

## Fase 4 — US2: Calificar operación

Objetivo y prueba independiente: dado mi reserva finalizada sin reseña previa, califico de 1 a 5; se registra una reseña única y se actualiza la reputación publicada.

- [ ] T010 [US2] Implementar el caso «Calificar operación» con autorización/transiciones en backend/src/modules/resenas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T011 [US2] Exponer DTO y controlador del caso «Calificar operación» en backend/src/modules/resenas/presentacion/ según contracts/api.md.
- [ ] T012 [US2] Integrar el recorrido «Calificar operación» y sus estados negativos en frontend/src/components/resenas/ y frontend/src/app/.
- [ ] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Calificar operación» en backend/test/resenas/ y frontend/tests/resenas/; registrar resultado en quickstart.md.

## Fase 5 — US3: Registrar garantía e incidencia

Objetivo y prueba independiente: dado un acuerdo de garantía, reporto incidencia; se conserva historial para revisión humana sin simular custodia.

- [ ] T014 [US3] Implementar el caso «Registrar garantía e incidencia» con autorización/transiciones en backend/src/modules/resenas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T015 [US3] Exponer DTO y controlador del caso «Registrar garantía e incidencia» en backend/src/modules/resenas/presentacion/ según contracts/api.md.
- [ ] T016 [US3] Integrar el recorrido «Registrar garantía e incidencia» y sus estados negativos en frontend/src/components/resenas/ y frontend/src/app/.
- [ ] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Registrar garantía e incidencia» en backend/test/resenas/ y frontend/tests/resenas/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [ ] T018 Resolver D09 y permisos por etapa/participante; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.
- [ ] T019 Crear entidades/constraints de reseña, garantía, evidencia e incidencia; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.
- [ ] T020 Implementar adapter de archivos privados y descarga autorizada; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.
- [ ] T021 Implementar elegibilidad de reseña por ConsultaReservas y moderación; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.
- [ ] T022 Implementar registro documental y revisión humana de incidencias; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.
- [ ] T023 Integrar interfaz de evidencias/reseñas/garantía y verificar privacidad; archivos previstos en backend/src/modules/resenas/ o frontend/src/components/resenas/ según plan.md.

## Cierre y verificación crítica

- [ ] T024 Reseña ajena/anticipada/duplicada y puntuación inválida rechazadas; duplicado concurrente único. Registrar evidencia en specs/006-reputacion-confianza/quickstart.md.
- [ ] T025 Descargas de evidencia ajena y archivos inválidos rechazados; hashes y referencias verificables. Registrar evidencia en specs/006-reputacion-confianza/quickstart.md.
- [ ] T026 Moderación conserva auditoría y recalcula agregados sin reseñas ocultas. Registrar evidencia en specs/006-reputacion-confianza/quickstart.md.
- [ ] T027 Restaurar archivos junto con metadata conforme a EQ-09. Registrar evidencia en specs/006-reputacion-confianza/quickstart.md.
- [ ] T028 Analizar consistencia e imports y registrar resultados/limitaciones en specs/006-reputacion-confianza/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 002-usuarios-acceso, 005-reservas-contratacion-pagos. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
