# Decisiones e investigación — Reservas, contratación y pagos

## Evidencia local

ADR-004, ADR-005, ADR-006, ADR-011 gobiernan esta entrega. HU03, HU04, HU05, HU06, HU07, HU08, HU09, HU19, HU20 y RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Intervalos [inicio,fin), instantes UTC; cada unidad física/agenda bloquea por recursoId en PostgreSQL.
- PENDIENTE no bloquea; aceptación guarda reserva+bloqueo+outbox juntos. GiST evita solapamientos; vencimiento libera en transacción.
- Cotización variable aceptada antes del cobro; snapshot servidor con tarifa, comisión y total. Garantía no genera comisión ni custodia.
- Persistir intento antes de I/O externo; no mantener transacción SQL durante el cobro.

## Decisiones pendientes

- D05: días calendario o bloques 24 h, retiro/devolución, mínimos y tarifa; bloquea cálculo comercial.
- D06: secuencia cotización/aceptación/bloqueo, vencimiento (15 min propuesto), anticipo y vigencia; bloquea aceptación/cobro de oficio.
- D07: comisión, cancelaciones, reembolsos y pago tardío; bloquea checkout operativo.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.

## D12 — Coherencia entre hitos y evidencias

Pendiente: fijar el protocolo de registro entre el hito de Reservas y la evidencia de Reputación sin introducir una dependencia cíclica. Reservas publica eventos; Reputación consulta estado/participantes por fachada y registra evidencia privada. Precisar validación, confirmación de registro y recuperación de fallos antes de implementar RF18/RF19. No cambiar tablas ajenas directamente.
