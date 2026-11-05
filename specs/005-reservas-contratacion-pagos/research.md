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

- D05 queda resuelta para el alcance de herramientas anterior; no bloquea 005.2.
- D06 conserva pendientes de secuencia cotización/aceptación/bloqueo, anticipo y vigencia de oficios. Los 15 min eran una propuesta histórica, sustituida por 60 min para herramientas.
- D07 conserva pendientes de comisión, cancelaciones, reembolsos y pago tardío del checkout externo; el acuerdo de efectivo anterior tiene alcance propio.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

### Alcance de implementación — 005.3, 2026-10-27

El usuario eligió continuar con cotizaciones de oficios después de comparar esta etapa con Culqi sandbox. Se implementa el acuerdo de alcance, materiales/exclusiones, total en PEN y vigencia, con versiones conservadas y respuesta explícita del cliente. Las partes no resueltas de D06/D07 no se transforman en políticas comerciales: aceptar no bloquea agenda, no exige anticipo ni registra un pago. La interfaz lo explica antes de confirmar; la decisión de reserva operativa de agenda permanece abierta.

La vigencia la indica el proveedor y se valida hasta el inicio solicitado como máximo. Solo la versión más reciente sin respuesta y vigente puede aceptarse/rechazarse. Una respuesta incrementa la versión de solicitud; el bloqueo transaccional evita aceptar un precio mientras se sustituye. Después de aceptar se conserva el acuerdo y no se emiten nuevas versiones. El límite técnico de 50 versiones mantiene acotado el historial de una solicitud; no define duración, comisión o anticipo comercial.

### Acuerdo del usuario — 005.4, confirmación de agenda sin anticipo

El usuario autorizó continuar con la recomendación de reservar el horario solicitado al aceptar una cotización vigente, si sigue disponible, sin anticipo. Se incorpora SERVICIO_CONFIRMADO, distinto del apartado de herramientas de 60 min. La agenda es el recurso concreto de la oferta; no se afirma exclusión global entre agendas independientes de un proveedor.

Aceptar guarda respuesta, bloqueo exacto [inicio,fin), estado y eventos en una transacción. Un conflicto revierte todos esos efectos y requiere coordinar otra solicitud. No se cobra ni se confirma ejecución del servicio. El horario confirmado no vence por el temporizador de herramientas. La cancelación con motivo antes del inicio libera el bloqueo y conserva el precio y la aceptación; el cierre/cancelación posterior al inicio queda pendiente del ciclo de ejecución del oficio.

Los acuerdos aceptados en 005.3 no se convierten automáticamente: podrían tener horarios superpuestos. El cliente dispone de confirmación expresa del horario, con validación actual de oferta/recurso y exclusión. Se conserva la aceptación histórica aunque su antigua vigencia haya terminado. Las políticas de anticipo, pasarela, ejecución/cierre y disputas siguen pendientes.

### Acuerdo del usuario — 005.5, 2026-11-05, ejecución y cierre de oficios

El usuario eligió dos reglas al preguntársele antes de implementar. Primera: el oficio se paga en efectivo directo al proveedor al cerrar, por el total de la cotización aceptada, sin comisión ni custodia. Segunda: cualquiera de los participantes puede cancelar con motivo mientras el trabajo no se haya iniciado, aunque ya pasó la hora acordada; libera la agenda, sin penalidad ni dinero. Sustituye la respuesta 409 de cancelación posterior al inicio de 005.4.

El flujo, aprobado junto con esas reglas, es: el proveedor registra el inicio desde la hora acordada; declara el término y el efectivo recibido; el cliente confirma, o rechaza con motivo, lo que anula la declaración y vuelve al trabajo en curso. El importe proviene siempre de la cotización aceptada; ningún endpoint lo recibe del navegador. La agenda se libera al confirmar el cierre.

Límites conservados: son declaraciones auditadas, sin verificación bancaria ni evidencia fotográfica (D12). No hay cierre automático si el cliente no responde, cancelación después de iniciado ni resolución de disputas por rechazos repetidos; esas políticas no se deducen de este acuerdo. Mientras no haya respuesta el bloqueo sigue activo, pero solo sobre el intervalo acordado.

### Decisión técnica — 005.6, 2026-11-05, despacho de eventos

Se implementa el puerto Notificador y un despachador del outbox, sin canal real: D08 sigue pendiente. Sin Notificador configurado el despacho queda inactivo y los eventos siguen pendientes. Se descartó un adaptador simulado en ejecución porque marcaría como enviados eventos que nadie recibió.

La entrega es al menos una vez: un corte después de enviar repite el evento con el mismo id, y el canal debe deduplicar. Cada reserva recibe sus eventos en orden, según una secuencia asignada al insertar. Los reintentos esperan de 30 s a 1 h, con 10 intentos; después, o ante un rechazo definitivo, el evento queda FALLIDO y deja pasar al siguiente. No se mantiene una transacción durante el envío, y solo se guarda un código de error, porque el mensaje del canal podría contener datos personales.

Límites: reprocesar eventos FALLIDO es una operación manual, sin interfaz. Al conectar un canal se enviarán también los eventos pendientes acumulados, incluidos los antiguos; hay que decidir antes si se descartan los que ya no sean útiles. Falta definir qué eventos recibe cada participante y por qué canal.

### Decisión del usuario — 005.7, 2026-11-05, avisos dentro de la app

El usuario aceptó la recomendación de empezar por un canal dentro de la app, porque no requiere credenciales ni proveedor externo y cubre HU09/RF10 sin esperar a D08. Entregar un evento significa dejar el aviso en la bandeja del destinatario. Esto actualiza la inactividad descrita en 005.6: el despacho queda activo por defecto, y `QATU_DESPACHO_EVENTOS=inactivo` lo detiene.

Criterios técnicos del incremento, revisables por el usuario: una acción avisa al otro participante y nunca a quien la hizo; un vencimiento avisa a ambos; los eventos anteriores al canal no se convierten en avisos, para no inundar la bandeja con noticias antiguas. Los mensajes se generan al leer, sin guardar texto ni datos personales en el aviso. La campana consulta el resumen al navegar y cada 60 s, sin conexión en tiempo real, por lo que un aviso puede tardar en verse.

Límites: no hay envío fuera de la app, preferencias por tipo de aviso ni límite de conservación. WhatsApp y correo siguen pendientes de D08.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

### Incremento 005.1

Se inicia únicamente el recorrido de solicitud PENDIENTE, consulta propia y rechazo con motivo. Estas operaciones no calculan precio comercial, no bloquean recursos y no cobran; D05–D08 continúan pendientes. La tarifa de referencia se captura desde Catálogo y se identifica como referencia, sin comisión ni total. La aceptación y su duración no se deducen de la propuesta de 15 minutos. Los eventos se persisten, pero la entrega externa queda pendiente de D08.

El usuario autorizó iniciar el siguiente módulo y publicar el registro del CI. Se solicitaron las decisiones de cómputo de duración (D05) y vencimiento (parte de D06); no se consideran resueltas por el silencio. El resto de US1 y US2–US4 conserva sus bloqueos y criterios de aceptación.

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.

## D12 — Coherencia entre hitos y evidencias

Pendiente: fijar el protocolo de registro entre el hito de Reservas y la evidencia de Reputación sin introducir una dependencia cíclica. Reservas publica eventos; Reputación consulta estado/participantes por fachada y registra evidencia privada. Precisar validación, confirmación de registro y recuperación de fallos antes de implementar RF18/RF19. No cambiar tablas ajenas directamente.
