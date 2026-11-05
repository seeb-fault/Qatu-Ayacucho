# Tareas — Reservas, contratación y pagos

Estado: 005.1/005.2 implementados y verificados localmente. Herramientas con aceptación/bloqueo concurrente, visitas, efectivo bilateral y devolución disponibles. 005.3/005.4 incorporan cotización y agenda de oficios sin anticipo; 005.5, ejecución y cierre con efectivo bilateral; 005.6/005.7, despacho de eventos y avisos dentro de la app. Las tareas originales del módulo completo conservan sus pendientes cuando incluyen disputas, pasarela o evidencia externa.

## Incremento 005.1 — Subconjunto no bloqueado

- [x] T037 Definir DTO, permisos y límites del subconjunto en contracts/api.md y sincronizar el contrato externo; conservar D05–D08 abiertas.
- [x] T038 Implementar solicitud/snapshot de referencia, consulta participante y rechazo con versión en backend/src/modules/reservas/; migración y eventos atómicos propios, sin consultas a tablas ajenas.
- [x] T039 Integrar formulario y bandejas en frontend/src/app/reservas/ y frontend/src/components/reservas/; enlaces desde oferta, cuenta y navegación.
- [x] T040 Verificar dominio, HTTP/PostgreSQL, rollback de outbox y recorrido de navegador; registrar resultados en quickstart.md y activar CI específico sin declarar completa 005.

## Incremento 005.2 — Herramientas y efectivo

- [x] T041 Registrar el acuerdo de bloques de 24 h, apartado de 60 min, tolerancia de devolución y efectivo directo en research.md y contratos.
- [x] T042 Implementar condiciones inmutables, bloqueo GiST, posesión única y vencimiento transaccional; migraciones 002/003 en backend/migrations/reservas/.
- [x] T043 Implementar visita, ampliación/cancelación, efectivo bilateral y devolución con saldo sin cobro automático en backend/src/modules/reservas/.
- [x] T044 Integrar disponibilidad, condiciones aceptadas, acciones por participante y coordinación por enlace WhatsApp en frontend/src/components/reservas/.
- [x] T045 Verificar 24 pruebas de reservas con PostgreSQL, incluidos 100 pares concurrentes, y tres escenarios de navegador; registrar ejecuciones y corrección del selector en quickstart.md.
- [x] T046 Declarar 005.2 en manifiesto/detector CI y sincronizar estado, modelo y pendientes sin declarar completa la entrega 005.

## Incremento 005.3 — Acuerdo económico de oficios

- [x] T047 Concretar propuestas con alcance/materiales/total/vigencia y distinguir acuerdo de agenda/pago en research.md y contracts/api.md.
- [x] T048 Implementar migración 004, versiones inmutables, respuesta sobre última propuesta vigente y evento atómico en backend/src/modules/reservas/.
- [x] T049 Integrar propuesta, rechazo con motivo, nueva versión y aceptación explícita en frontend/src/components/reservas/CotizacionesServicio.tsx.
- [x] T050 Verificar permisos, vencimiento, concurrencia, inmutabilidad y rollback con PostgreSQL y recorrido web; registrar resultados en quickstart.md y activar 005.3 en CI.

## Incremento 005.4 — Confirmación de agenda sin anticipo

- [x] T051 Registrar la decisión de confirmar horario al aceptar y la compatibilidad con acuerdos previos en research.md y contracts/api.md.
- [x] T052 Implementar estado SERVICIO_CONFIRMADO, exclusión por agenda, cancelación previa al inicio y evento atómico; migración 005 y backend de Reservas.
- [x] T053 Integrar estado, explicación de horario/anticipo y confirmación expresa de acuerdos previos en la interfaz de Reservas.
- [x] T054 Verificar aceptación concurrente, conflictos, cancelación/liberación, rollback, rangos adyacentes y acuerdos históricos; registrar evidencia y activar 005.4 en CI.

## Incremento 005.5 — Ejecución y cierre de oficios

- [x] T055 Registrar las reglas elegidas por el usuario (efectivo al cierre por el total aceptado y cancelación con motivo mientras no se inicie) en research.md y contracts/api.md.
- [x] T056 Implementar estados, transiciones, migración 006, efectivo tomado de la cotización aceptada, liberación al cerrar y eventos atómicos en backend/src/modules/reservas/.
- [x] T057 Integrar inicio, término, confirmación y rechazo por participante en frontend/src/components/reservas/TarjetaReserva.tsx.
- [x] T058 Verificar permisos, hora de inicio, concurrencia, rollback, restricciones PostgreSQL y recorrido web; registrar evidencia en quickstart.md y activar 005.5 en CI.

## Incremento 005.6 — Despacho de eventos

- [x] T059 Registrar entrega al menos una vez, orden por reserva, reintentos y activación condicionada a un canal real en research.md y contracts/api.md.
- [x] T060 Implementar puerto Notificador, migración 007 y despachador sin transacción durante el envío en backend/src/modules/reservas/.
- [x] T061 Verificar con doble: orden, reintentos, agotamiento, carrera entre procesos, corte, proceso atrasado y canal caído; registrar evidencia en quickstart.md y activar 005.6 en CI.

## Incremento 005.7 — Avisos dentro de la app

- [x] T062 Registrar el canal dentro de la app, los destinatarios por evento y el tratamiento de eventos anteriores en research.md y contracts/api.md.
- [x] T063 Implementar migración 008, adaptador de bandeja, lectura aislada por usuario y activación del despacho en backend/src/modules/reservas/.
- [x] T064 Integrar campana, bandeja de avisos y enlace a la solicitud en frontend/src/components/avisos/ y frontend/src/app/avisos/.
- [x] T065 Verificar destinatarios, duplicados, aislamiento y recorrido web; registrar evidencia en quickstart.md y activar 005.7 en CI.

## Fase 1 — Preparación

- [ ] T001 Resolver las decisiones afectadas en specs/005-reservas-contratacion-pagos/research.md; sincronizar ADR/contratos si cambian.
- [ ] T002 Completar DTO/estados y matriz de permisos en specs/005-reservas-contratacion-pagos/contracts/api.md.

## Fase 2 — Fundaciones

- [ ] T003 Crear entidades/valores y puertos en backend/src/modules/reservas/dominio/ según data-model.md.
- [ ] T004 Crear migraciones con constraints/índices y repositorios propios en backend/migrations/reservas/ y backend/src/modules/reservas/infraestructura/.
- [ ] T005 Conectar fachada, adapters y composición en backend/src/modules/reservas/reservas.module.ts; sin imports cíclicos.

## Fase 3 — US1: Solicitar y responder

Objetivo y prueba independiente: dado dos solicitudes para el mismo recurso, se aceptan concurrentemente; una sola queda aceptada y la otra obtiene conflicto.

- [ ] T006 [US1] Implementar el caso «Solicitar y responder» con autorización/transiciones en backend/src/modules/reservas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T007 [US1] Exponer DTO y controlador del caso «Solicitar y responder» en backend/src/modules/reservas/presentacion/ según contracts/api.md.
- [ ] T008 [US1] Integrar el recorrido «Solicitar y responder» y sus estados negativos en frontend/src/components/reservas/ y frontend/src/app/.
- [ ] T009 [US1] Verificar el caso positivo y el rechazo no autorizado de «Solicitar y responder» en backend/test/reservas/ y frontend/tests/reservas/; registrar resultado en quickstart.md.

## Fase 4 — US2: Cotizar un oficio

Objetivo y prueba independiente: dado un servicio variable, acepto una versión vigente; el pago usa el snapshot aceptado y no un precio del navegador.

- [ ] T010 [US2] Implementar el caso «Cotizar un oficio» con autorización/transiciones en backend/src/modules/reservas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T011 [US2] Exponer DTO y controlador del caso «Cotizar un oficio» en backend/src/modules/reservas/presentacion/ según contracts/api.md.
- [ ] T012 [US2] Integrar el recorrido «Cotizar un oficio» y sus estados negativos en frontend/src/components/reservas/ y frontend/src/app/.
- [ ] T013 [US2] Verificar el caso positivo y el rechazo no autorizado de «Cotizar un oficio» en backend/test/reservas/ y frontend/tests/reservas/; registrar resultado en quickstart.md.

## Fase 5 — US3: Pagar con recuperación

Objetivo y prueba independiente: dado un intento persistido, ocurre timeout o se repite el webhook; se consulta/deduplica sin iniciar un cobro adicional por incertidumbre.

- [ ] T014 [US3] Implementar el caso «Pagar con recuperación» con autorización/transiciones en backend/src/modules/reservas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T015 [US3] Exponer DTO y controlador del caso «Pagar con recuperación» en backend/src/modules/reservas/presentacion/ según contracts/api.md.
- [ ] T016 [US3] Integrar el recorrido «Pagar con recuperación» y sus estados negativos en frontend/src/components/reservas/ y frontend/src/app/.
- [ ] T017 [US3] Verificar el caso positivo y el rechazo no autorizado de «Pagar con recuperación» en backend/test/reservas/ y frontend/tests/reservas/; registrar resultado en quickstart.md.

## Fase 6 — US4: Consultar y cerrar operación

Objetivo y prueba independiente: dado una reserva autorizada, registro inicio o cierre con evidencia; se valida transición y se emite evento durable.

- [ ] T018 [US4] Implementar el caso «Consultar y cerrar operación» con autorización/transiciones en backend/src/modules/reservas/aplicacion/; cumplir los FR aplicables de spec.md.
- [ ] T019 [US4] Exponer DTO y controlador del caso «Consultar y cerrar operación» en backend/src/modules/reservas/presentacion/ según contracts/api.md.
- [ ] T020 [US4] Integrar el recorrido «Consultar y cerrar operación» y sus estados negativos en frontend/src/components/reservas/ y frontend/src/app/.
- [ ] T021 [US4] Verificar el caso positivo y el rechazo no autorizado de «Consultar y cerrar operación» en backend/test/reservas/ y frontend/tests/reservas/; registrar resultado en quickstart.md.

## Trabajo de integración específico

- [ ] T022 Resolver D05-D08 y revisar contratos/estados con snapshots; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T023 Crear reserva/bloqueos/cotizaciones y exclusión PostgreSQL; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T024 Implementar solicitudes, aceptación/rechazo, expiración y calendario; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T025 Implementar cotización versionada y aceptación explícita; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T026 Implementar intento persistido, adapter Culqi e idempotencia; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T027 Implementar webhook verificado, conciliación y pago tardío; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T028 Implementar outbox y adapter externo de notificación con reintento; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T029 Integrar bandejas, checkout, entrega/devolución y estados separados; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.
- [ ] T030 Ejecutar EQ-07/EQ-08 y sandbox, guardar evidencias; archivos previstos en backend/src/modules/reservas/ o frontend/src/components/reservas/ según plan.md.

## Cierre y verificación crítica

- [ ] T031 EQ-07: 100 pares concurrentes, una aceptación por par y cero bloqueos superpuestos. Registrar evidencia en specs/005-reservas-contratacion-pagos/quickstart.md.
- [ ] T032 EQ-08: 20 reenvíos, un efecto; monto/moneda incorrectos, falsificación, timeout, pago tardío y claves distintas. Registrar evidencia en specs/005-reservas-contratacion-pagos/quickstart.md.
- [ ] T033 Carrera entre expiración y pago; límites adyacentes de rango y agenda del mismo proveedor. Registrar evidencia en specs/005-reservas-contratacion-pagos/quickstart.md.
- [ ] T034 Outbox tras reinicio y canal externo caído; consumidores deduplicados. Registrar evidencia en specs/005-reservas-contratacion-pagos/quickstart.md.
- [ ] T035 Contrato con doble y después Culqi sandbox real; Yape documentar habilitación o bloqueo. Registrar evidencia en specs/005-reservas-contratacion-pagos/quickstart.md.
- [ ] T036 Analizar consistencia e imports y registrar resultados/limitaciones en specs/005-reservas-contratacion-pagos/checklists/requirements.md.

## Dependencias y estrategia

Preparación → fundaciones → historias en el orden indicado → integración → verificación. Dependencias de módulos: 002-usuarios-acceso, 004-catalogo-publicaciones. Los pasos específicos refinan las historias; no se implementan dos veces casos de uso compartidos. Primero completar un recorrido mínimo por historia y después los fallos definidos.

Paralelismo posible tras fundaciones: componentes web y fixtures de prueba en archivos distintos una vez fijado el contrato. No hay tareas marcadas [P] hasta asignar archivos concretos sin conflicto. No ejecutar tareas bloqueadas por políticas sin resolver.
