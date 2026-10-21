# 005 — Reservas, contratación y pagos

**Estado:** especificado; implementación y aceptación pendientes. **Fecha:** 2026-10-15.
**Módulo técnico:** reservas. **Historias:** HU03, HU04, HU05, HU06, HU07, HU08, HU09, HU19, HU20.

## Objetivo y alcance

Gestionar solicitudes de herramientas y oficios, cotizaciones, disponibilidad, aceptación, pagos externos y cierre consistente del ciclo de reserva.

Interfaz prevista: Solicitud, cotización versionada, calendario, bandejas cliente/proveedor, checkout y estados pendientes/desconocidos.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Solicitar y responder (P1)

Como cliente/proveedor, quiero acordar fechas sin doble asignación.

**Prueba independiente:** Dado dos solicitudes para el mismo recurso, cuando se aceptan concurrentemente, entonces una sola queda aceptada y la otra obtiene conflicto.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Cotizar un oficio (P1)

Como cliente, quiero aceptar alcance e importe antes de pagar.

**Prueba independiente:** Dado un servicio variable, cuando acepto una versión vigente, entonces el pago usa el snapshot aceptado y no un precio del navegador.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Pagar con recuperación (P1)

Como cliente, quiero conocer el resultado verificado.

**Prueba independiente:** Dado un intento persistido, cuando ocurre timeout o se repite el webhook, entonces se consulta/deduplica sin iniciar un cobro adicional por incertidumbre.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US4 — Consultar y cerrar operación (P1)

Como participante, quiero seguir mi reserva y completar su ciclo.

**Prueba independiente:** Dado una reserva autorizada, cuando registro inicio o cierre con evidencia, entonces se valida transición y se emite evento durable.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M005-FR01 | Intervalos [inicio,fin), instantes UTC; cada unidad física/agenda bloquea por recursoId en PostgreSQL. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR02 | PENDIENTE no bloquea; aceptación guarda reserva+bloqueo+outbox juntos. GiST evita solapamientos; vencimiento libera en transacción. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR03 | Cotización variable aceptada antes del cobro; snapshot servidor con tarifa, comisión y total. Garantía no genera comisión ni custodia. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR04 | Persistir intento antes de I/O externo; no mantener transacción SQL durante el cobro. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR05 | Clave repetida con payload distinto produce 409; claves distintas no permiten dos intentos activos de la misma operación. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR06 | Verificar referencia, importe, moneda y estado externo; deduplicar evento y confirmar atómicamente con outbox. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR07 | Timeout significa DESCONOCIDO; conciliar antes de nuevo cobro. Pago tardío no reactiva reserva vencida ni reasigna recurso. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR08 | Checkout tokeniza con proveedor; backend no recibe PAN/CVV. Culqi sandbox obligatorio; Yape solo como medio habilitado. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |
| M005-FR09 | Notificaciones externas por outbox/reintento; fallo del canal no revierte estado de reserva. | RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: reservas; bloqueos; intentos_pago; eventos_pasarela; outbox_eventos; cotizaciones y sus versiones (extensión propuesta para RF23). Identidad de actor derivada del servidor. Contratos entre módulos: ConsultaDisponibilidad y ConsultaReservas; eventos de estado por outbox; ProcesadorPagos y Notificador como puertos internos.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- EQ-07: 100 pares concurrentes, una aceptación por par y cero bloqueos superpuestos.
- EQ-08: 20 reenvíos, un efecto; monto/moneda incorrectos, falsificación, timeout, pago tardío y claves distintas.
- Carrera entre expiración y pago; límites adyacentes de rango y agenda del mismo proveedor.
- Outbox tras reinicio y canal externo caído; consumidores deduplicados.
- Contrato con doble y después Culqi sandbox real; Yape documentar habilitación o bloqueo.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-04, EQ-05, EQ-06, EQ-07, EQ-08 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D05: días calendario o bloques 24 h, retiro/devolución, mínimos y tarifa; bloquea cálculo comercial.
- D06: secuencia cotización/aceptación/bloqueo, vencimiento (15 min propuesto), anticipo y vigencia; bloquea aceptación/cobro de oficio.
- D07: comisión, cancelaciones, reembolsos y pago tardío; bloquea checkout operativo.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

- D12: protocolo de registro de hitos y evidencias entre módulos sin ciclo; pendiente antes de RF18/RF19.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

- [002-usuarios-acceso](../002-usuarios-acceso/spec.md).
- [004-catalogo-publicaciones](../004-catalogo-publicaciones/spec.md).

## Artifacts

[Plan](./plan.md) · [Investigación de decisiones](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).

## Fuentes

- [Historias de usuario](../../docs/01-analisis-de-sistema/02-historias-del-usuario.md).
- [Requisitos funcionales](../../docs/01-analisis-de-sistema/03-requisitos-funcionales.md).
- [Reglas RN01–RN12 y módulos](../../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).
- [Modelo lógico](../../docs/03-diseño-de-software/modelo-de-datos.md).
- [Contratos REST vigentes](../../docs/03-diseño-de-software/diseño-externo/contratos-api.md).
- [Escenarios EQ](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- [ADR](../../docs/01-analisis-de-sistema/07-desision-arquitectonica.md).
- [Constitución](../../.specify/memory/constitution.md).
