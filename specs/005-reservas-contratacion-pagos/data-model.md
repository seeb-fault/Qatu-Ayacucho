# Modelo de datos — Reservas, contratación y pagos

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Esta vista pertenece a reservas; no es una migración aplicada.

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
