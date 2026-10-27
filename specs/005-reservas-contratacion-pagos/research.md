# Decisiones e investigación — Reservas, contratación y pagos

## Evidencia local

ADR-004, ADR-005, ADR-006, ADR-011 gobiernan esta entrega. HU03, HU04, HU05, HU06, HU07, HU08, HU09, HU19, HU20 y RF04, RF05, RF06, RF07, RF08, RF09, RF10, RF18, RF21, RF22, RF23 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Intervalos [inicio,fin), instantes UTC; cada unidad física/agenda bloquea por recursoId en PostgreSQL.
- PENDIENTE no bloquea; aceptación guarda reserva+bloqueo+outbox juntos. GiST evita solapamientos; vencimiento libera en transacción.
- Cotización variable aceptada antes del cobro; snapshot servidor con tarifa, comisión y total. Garantía no genera comisión ni custodia.
- Persistir intento antes de I/O externo; no mantener transacción SQL durante el cobro.

## Decisiones pendientes

### Acuerdo del usuario — 005.2, 2026-10-27

El usuario aprobó explícitamente la propuesta de alquiler por bloques de 24 horas, apartado de 60 minutos, visita previa sin bloqueo, efectivo al recoger y tolerancia de devolución de 30 minutos antes de sumar un día. Indicó implementar la pasarela después de este recorrido. Se actualiza Constitución 1.1.0/ADR-013; esta autorización sustituye el bloqueo de la fase de efectivo, sin dar por integrada la pasarela.

- D05 resuelta para herramientas a tarifa fija: mínimo un bloque; se cobra cada bloque de 24 horas iniciado del horario pactado [inicio,fin). Devolución después de fin+30 minutos suma cada bloque adicional de 24 horas iniciado descontando la tolerancia. El horario y la tarifa se aceptan por el cliente al solicitar; el servidor conserva política y total. Una tarifa cambiada desde la solicitud exige volver a solicitar, no aceptar silenciosamente otro importe. Recoger tarde no desplaza automáticamente el fin acordado.
- D06 resuelta para estas herramientas: aceptación del proveedor bloquea el rango solicitado durante 60 minutos desde la aceptación, hasta fin como máximo. Debe apartarse cuando el cliente pueda acercarse durante la siguiente hora; una solicitud futura puede seguir pendiente. El proveedor puede ampliar expresamente hasta otros 60 minutos desde ahora con motivo, antes del vencimiento y sin superar fin. Vencimiento libera el bloqueo atómicamente. Visita acordada no bloquea y no se transforma automáticamente en alquiler. Oficios/cotizaciones siguen pendientes.
- D07 parcial: no se cobra comisión de plataforma en el recorrido de efectivo; el dinero se entrega directamente al proveedor, sin custodia ni reembolso automático. Antes de registrar efectivo cualquiera de los participantes puede cancelar el apartado con motivo. Luego no se habilita cancelación económica sin política de disputa/reembolso. Un recargo calculado queda como saldo por coordinar; no se declara cobrado automáticamente.
- Registro de efectivo y entrega por proveedor conserva el importe pactado y detiene el vencimiento; estado ENTREGA_POR_CONFIRMAR, pago REGISTRADO_PROVEEDOR. El cliente confirma haber pagado y recibido para EN_CURSO/pago CONFIRMADO_PARTICIPANTES. No se confunde registro unilateral con verificación bancaria. Una sola posesión física por recurso, incluso si los rangos de dos reservas son adyacentes.
- El cliente avisa la devolución con hora de servidor; el proveedor confirma esa hora informada o rechaza el aviso con motivo. Solo la confirmación libera posesión/bloqueo y calcula importe final/saldo. Son declaraciones auditadas, no fotografías ni resolución automática de daños; D12/evidencias de Reputación siguen pendientes.
- WhatsApp comienza como enlace para compartir el resumen y elegir el destinatario. No se envían mensajes automáticamente, no se publican teléfonos y no se altera la reserva por mensajes externos. D08 de integraciones externas continúa pendiente.

- D05: días calendario o bloques 24 h, retiro/devolución, mínimos y tarifa; bloquea cálculo comercial.
- D06: secuencia cotización/aceptación/bloqueo, vencimiento (15 min propuesto), anticipo y vigencia; bloquea aceptación/cobro de oficio.
- D07: comisión, cancelaciones, reembolsos y pago tardío; bloquea checkout operativo.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

### Incremento 005.1

Se inicia únicamente el recorrido de solicitud PENDIENTE, consulta propia y rechazo con motivo. Estas operaciones no calculan precio comercial, no bloquean recursos y no cobran; D05–D08 continúan pendientes. La tarifa de referencia se captura desde Catálogo y se identifica como referencia, sin comisión ni total. La aceptación y su duración no se deducen de la propuesta de 15 minutos. Los eventos se persisten, pero la entrega externa queda pendiente de D08.

El usuario autorizó iniciar el siguiente módulo y publicar el registro del CI. Se solicitaron las decisiones de cómputo de duración (D05) y vencimiento (parte de D06); no se consideran resueltas por el silencio. El resto de US1 y US2–US4 conserva sus bloqueos y criterios de aceptación.

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.

## D12 — Coherencia entre hitos y evidencias

Pendiente: fijar el protocolo de registro entre el hito de Reservas y la evidencia de Reputación sin introducir una dependencia cíclica. Reservas publica eventos; Reputación consulta estado/participantes por fachada y registra evidencia privada. Precisar validación, confirmación de registro y recuperación de fallos antes de implementar RF18/RF19. No cambiar tablas ajenas directamente.
