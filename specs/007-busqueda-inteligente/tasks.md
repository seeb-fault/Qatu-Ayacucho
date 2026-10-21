# Tareas — Búsqueda inteligente

Estado: pendiente. Alcance documental; ninguna tarea de código se ha ejecutado.

## Fase 1 — Preparación

- [ ] T001 Resolver las decisiones afectadas en specs/007-busqueda-inteligente/research.md; sincronizar ADR/contratos si cambian.
- [ ] T002 Completar DTO/estados y matriz de permisos en specs/007-busqueda-inteligente/contracts/api.md.

## Fase 2 — Fundaciones

- [ ] T003 Crear entidades/valores y puertos en backend/src/modules/busqueda/dominio/ según data-model.md.
- [ ] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/busqueda/ y backend/src/modules/busqueda/infraestructura/.
- [ ] T005 Conectar fachada, adapters y composición en backend/src/modules/busqueda/busqueda.module.ts; sin imports cíclicos.

## Fase 3 — US1: Expresar una necesidad

Objetivo y prueba independiente: dado una consulta explícita de taladro/zona/presupuesto, ejecuto búsqueda; veo filtros editables y ofertas con IDs/precios reales.

- [ ] T006 [US1] Implementar el caso «Expresar una necesidad» con autorización/transiciones en backend/src/modules/busqueda/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T007 [US1] Exponer DTO y controlador del caso «Expresar una necesidad» en backend/src/modules/busqueda/presentacion/ según contracts/api.md.
- [ ] T008 [US1] Integrar el recorrido «Expresar una necesidad» y sus estados negativos en frontend/src/components/busqueda/ y frontend/src/app/.
- [ ] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Expresar una necesidad» en backend/test/busqueda/ y frontend/tests/busqueda/; registrar resultado en quickstart.md.

## Fase 4 — US2: Resolver ambigüedad

Objetivo y prueba independiente: dado una fecha relativa o categoría ambigua, se interpreta la consulta; se muestran campos que requieren precisión y prevalecen filtros manuales.

- [ ] T010 [US2] Implementar el caso «Resolver ambigüedad» con autorización/transiciones en backend/src/modules/busqueda/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T011 [US2] Exponer DTO y controlador del caso «Resolver ambigüedad» en backend/src/modules/busqueda/presentacion/ según contracts/api.md.
- [ ] T012 [US2] Integrar el recorrido «Resolver ambigüedad» y sus estados negativos en frontend/src/components/busqueda/ y frontend/src/app/.
- [ ] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Resolver ambigüedad» en backend/test/busqueda/ y frontend/tests/busqueda/; registrar resultado en quickstart.md.

## Fase 5 — US3: Buscar durante fallo de IA

Objetivo y prueba independiente: dado timeout, cuota o JSON inválido, ejecuto búsqueda; recibo modo convencional sin bloquear reservas ni pagos.

- [ ] T014 [US3] Implementar el caso «Buscar durante fallo de IA» con autorización/transiciones en backend/src/modules/busqueda/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T015 [US3] Exponer DTO y controlador del caso «Buscar durante fallo de IA» en backend/src/modules/busqueda/presentacion/ según contracts/api.md.
- [ ] T016 [US3] Integrar el recorrido «Buscar durante fallo de IA» y sus estados negativos en frontend/src/components/busqueda/ y frontend/src/app/.
- [ ] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Buscar durante fallo de IA» en backend/test/busqueda/ y frontend/tests/busqueda/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [ ] T018 Resolver D10 y fijar dataset/etiquetas y esquema de intención; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.
- [ ] T019 Implementar criterios y puertos de lectura sin SDK en dominio; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.
- [ ] T020 Implementar adapter IA con deadlines/cancelación y validación; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.
- [ ] T021 Implementar resolución de IDs, prioridad manual y fallback; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.
- [ ] T022 Conectar buscador/filtros/ambigüedad en web; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.
- [ ] T023 Medir EQ-02/EQ-10 y costos; no declarar calidad antes de evaluación; archivos previstos en backend/src/modules/busqueda/ o frontend/src/components/busqueda/ según plan.md.

## Cierre y verificación crítica

- [ ] T024 EQ-02: 429/5xx/latencia/JSON inválido con reservas/pagos operativos. Registrar evidencia en specs/007-busqueda-inteligente/quickstart.md.
- [ ] T025 EQ-10: 50 consultas (30 explícitas,10 ambiguas,10 adversariales), fecha fija y etiquetas humanas. Registrar evidencia en specs/007-busqueda-inteligente/quickstart.md.
- [ ] T026 Meta >=90% filtros exactos explícitos y >=80% pertinente en primeros5; cero IDs/precios inventados/escrituras. Registrar evidencia en specs/007-busqueda-inteligente/quickstart.md.
- [ ] T027 Proveedor IA sustituible por doble sin modificar dominio; cuotas y límite 500 caracteres. Registrar evidencia en specs/007-busqueda-inteligente/quickstart.md.
- [ ] T028 Analizar consistencia e imports y registrar resultados/limitaciones en specs/007-busqueda-inteligente/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 004-catalogo-publicaciones, 005-reservas-contratacion-pagos. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
