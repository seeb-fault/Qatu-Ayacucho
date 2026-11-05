# Modelo de datos — Reservas, contratación y pagos

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Esta vista pertenece a Reservas; distingue el esquema de 005.1/005.2/005.3 del modelo completo todavía propuesto.

## Esquema del incremento 005.1

La migración `backend/migrations/reservas/001-solicitudes.sql` crea `reservas` y `reservas_outbox`. `reservas` registra IDs lógicos de cliente, usuario titular del proveedor, proveedor, publicación y recurso; intervalo UTC, descripción, snapshot de referencia, estado PENDIENTE/RECHAZADA, motivo, versión y creación. Comprueba intervalo finito no vacío, cliente distinto del titular y coherencia del motivo. Un índice parcial impide duplicados exactos pendientes del mismo cliente/recurso/rango; no excluye solapamientos entre solicitudes. Los índices de cliente/titular soportan sus bandejas.

`reservas_outbox` referencia la solicitud y registra tipo, payload mínimo (reservaId/version), estado, intentos y próximo intento. No hay consumidor externo ni afirmación de entrega. Las transacciones de creación/rechazo guardan estado y evento juntos. El rollback manual está en `001-solicitudes.down.sql`.

## Esquema del incremento 005.2

`002-alquiler-efectivo.sql` agrega tipo de solicitud, condiciones comerciales, vencimiento, estado de efectivo, horas de entrega/recepción/devolución e importe final/saldo. Los estados de reserva son PENDIENTE, RECHAZADA, VISITA_ACORDADA, ACEPTADA, VENCIDA, CANCELADA, ENTREGA_POR_CONFIRMAR, EN_CURSO, DEVOLUCION_PENDIENTE y DEVUELTA. El pago distingue PENDIENTE, REGISTRADO_PROVEEDOR y CONFIRMADO_PARTICIPANTES; ninguno acredita verificación bancaria.

`reservas_bloqueos` guarda una fila por reserva, recurso, inicio/fin y activo. La exclusión GiST impide solapar rangos activos [inicio,fin) de un recurso. Triggers diferidos exigen coherencia entre estado y bloqueo al confirmar la transacción. Un índice parcial de posesión única impide dos entregas físicas simultáneas aunque los horarios sean adyacentes. Aceptación, vencimiento, cancelación y devolución actualizan bloqueo, reserva y outbox en una transacción.

`003-condiciones-estables.sql` valida la política diaria, importes enteros, tolerancia de 30 min y comisión cero del efectivo. Su trigger conserva condiciones, snapshot, participantes, publicación, recurso y tipo de solicitud ante actualizaciones. Las solicitudes antiguas sin condiciones no se convierten automáticamente en alquileres aceptables. En 005.2 todavía no se incluían cotizaciones ni intentos de pago externo; las cotizaciones se agregan abajo en 005.3.

## Esquema del incremento 005.3

`004-cotizaciones.sql` agrega `reservas_cotizaciones`, propia del módulo: clave compuesta reserva_id/version, alcance, materiales, importe_centimos, moneda PEN, vigente_hasta y creada_en. La respuesta conserva decision, motivo y respondida_en. La propuesta no se actualiza; solo se permite registrar una primera respuesta. Triggers impiden reescribir contenido/respuestas y borrar historial; un índice parcial permite una sola versión aceptada por solicitud. Las nuevas propuestas y respuestas incrementan la versión de la solicitud y generan outbox en la misma transacción.

Las cotizaciones no modifican condiciones de alquiler ni registran bloqueos o efectivo. El acuerdo aceptado se conserva separado del estado de reserva y del pago; la consulta expone el historial solo a los participantes. El rollback se niega si existen propuestas, para no borrar acuerdos. Los intentos de pasarela siguen pendientes.

## Esquema del incremento 005.4

`005-agenda-oficios.sql` agrega SERVICIO_CONFIRMADO y extiende la coherencia diferida de reserva/bloqueo/cotización. Este estado exige oferta de servicio, cotización aceptada y un bloqueo activo exacto para el recurso y horario; conserva condiciones de alquiler nulas, vencimiento nulo y pago pendiente sin efectivo. La exclusión GiST existente evita cruces de agenda. Un trigger diferido sobre cotizaciones refuerza la coherencia del conjunto al confirmar la transacción.

La aceptación y la cancelación usan el mismo orden de bloqueo por recurso y luego solicitud. El registro de AGENDA_CONFIRMADA forma parte de la transacción. No se migran automáticamente los acuerdos previos a horarios reservados. La reversión automática de esta migración se rechaza para no borrar compromisos; una corrección del esquema debe hacerse hacia delante.

## Esquema del incremento 005.5

`006-ejecucion-oficios.sql` agrega servicio_iniciado_en, servicio_terminado_en y servicio_cerrado_en, y los estados SERVICIO_EN_CURSO, SERVICIO_POR_CONFIRMAR y SERVICIO_CERRADO. Las restricciones exigen coherencia entre estado, marcas de tiempo y pago: en curso sin efectivo, por confirmar con REGISTRADO_PROVEEDOR y cerrado con CONFIRMADO_PARTICIPANTES, importe final igual al efectivo y saldo cero. Las marcas solo existen en esos estados, por lo que un servicio iniciado no puede volver a SERVICIO_CONFIRMADO ni cancelarse.

La comprobación diferida mantiene el bloqueo exacto hasta el cierre, lo libera en SERVICIO_CERRADO y rechaza efectivo distinto del total de la cotización aceptada. Los eventos nuevos se guardan en la misma transacción. La reversión automática se rechaza para conservar declaraciones auditadas.

## Esquema del incremento 005.6

`007-despacho-eventos.sql` agrega a `reservas_outbox` el estado FALLIDO, secuencia, enviado_en y ultimo_error. Una restricción exige enviado_en únicamente en ENVIADO, y otra limita ultimo_error a un código sin datos. Al reclamar un evento aumenta intentos y se adelanta proximo_intento 60 s, para que otro proceso lo retome si este se corta; el número de intento impide que un proceso atrasado resuelva un evento ya reclamado por otro. Revertir devuelve los FALLIDO a pendientes; al reaplicar, los ENVIADO toman creado_en como hora de envío, porque la real se pierde.

## Datos propios

reservas; bloqueos; intentos_pago; eventos_pasarela; outbox_eventos; cotizaciones y sus versiones (extensión propuesta para RF23).

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| reserva | id, clienteId, proveedorId, publicacionId, recursoId, inicio, fin, snapshot, estado, venceEn, version | inicio<fin; estado autorizado; actor servidor |
| bloqueo | id, reservaId, recursoId, rango, activo | reservaId UNIQUE; EXCLUDE recursoId/rango WHERE activo |
| cotizacion (propuesta) | id, reservaId, version, alcance, desglose, vigencia, estado, aceptadaPor, aceptadaEn | versiones inmutables; aceptar versión vigente antes de pagar |
| intento_pago | id, reservaId, operacionId, clave, payloadHash, montoCentimos, moneda, referencia, estado | unicidad clave/operación y control de intento activo |
| evento_pasarela | id, proveedor, eventoId, referencia, estadoVerificacion, recibidoEn | UNIQUE(proveedor,eventoId) |
| outbox_evento | id, agregadoId, tipo, payloadMinimo, estado, intentos, proximoIntento | misma transacción del agregado; consumidores deduplican |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Intervalos [inicio,fin), instantes UTC; cada unidad física/agenda bloquea por recursoId en PostgreSQL.
2. PENDIENTE no bloquea; aceptación guarda reserva+bloqueo+outbox juntos. GiST evita solapamientos; vencimiento libera en transacción.
3. Cotización variable aceptada antes del cobro; snapshot servidor con tarifa, comisión y total. Garantía no genera comisión ni custodia.
4. Persistir intento antes de I/O externo; no mantener transacción SQL durante el cobro.
5. Clave repetida con payload distinto produce 409; claves distintas no permiten dos intentos activos de la misma operación.
6. Verificar referencia, importe, moneda y estado externo; deduplicar evento y confirmar atómicamente con outbox.
7. Timeout significa DESCONOCIDO; conciliar antes de nuevo cobro. Pago tardío no reactiva reserva vencida ni reasigna recurso.
8. Checkout tokeniza con proveedor; backend no recibe PAN/CVV. Culqi sandbox obligatorio; Yape solo como medio habilitado.
9. Notificaciones externas por outbox/reintento; fallo del canal no revierte estado de reserva.

## Fronteras

ConsultaDisponibilidad y ConsultaReservas; eventos de estado por outbox; ProcesadorPagos y Notificador como puertos internos.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

Confirmar columnas y estados contra contratos antes de generar migraciones. Toda ampliación respecto al modelo lógico se registra como propuesta y se sincroniza; no se presenta como dato ya implementado.
