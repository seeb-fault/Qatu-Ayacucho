ALTER TABLE reservas
  ADD COLUMN servicio_iniciado_en timestamptz,
  ADD COLUMN servicio_terminado_en timestamptz,
  ADD COLUMN servicio_cerrado_en timestamptz;

ALTER TABLE reservas DROP CONSTRAINT reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check CHECK (estado IN
  ('PENDIENTE','RECHAZADA','VISITA_ACORDADA','ACEPTADA','VENCIDA','CANCELADA',
   'ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA','SERVICIO_CONFIRMADO',
   'SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO'));

ALTER TABLE reservas DROP CONSTRAINT reservas_efectivo_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_efectivo_check CHECK (
  (estado IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA') AND tipo_solicitud='alquiler'
    AND condiciones IS NOT NULL AND efectivo_centimos>0 AND efectivo_centimos=(condiciones->>'importeCentimos')::bigint AND entregado_en IS NOT NULL
    AND ((estado='ENTREGA_POR_CONFIRMAR' AND pago_estado='REGISTRADO_PROVEEDOR' AND recibido_en IS NULL)
      OR (estado<>'ENTREGA_POR_CONFIRMAR' AND pago_estado='CONFIRMADO_PARTICIPANTES' AND recibido_en IS NOT NULL)))
  OR (estado='SERVICIO_POR_CONFIRMAR' AND pago_estado='REGISTRADO_PROVEEDOR' AND efectivo_centimos>0)
  OR (estado='SERVICIO_CERRADO' AND pago_estado='CONFIRMADO_PARTICIPANTES' AND efectivo_centimos>0)
  OR (estado NOT IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO')
    AND pago_estado='PENDIENTE' AND efectivo_centimos=0));

ALTER TABLE reservas ADD CONSTRAINT reservas_ejecucion_servicio_check CHECK ((
  (estado IN ('SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO')
    AND snapshot->>'tipo'='servicio' AND tipo_solicitud='alquiler' AND condiciones IS NULL AND vence_en IS NULL
    AND servicio_iniciado_en IS NOT NULL
    AND (estado='SERVICIO_EN_CURSO')=(servicio_terminado_en IS NULL)
    AND (estado='SERVICIO_CERRADO')=(servicio_cerrado_en IS NOT NULL)
    AND (estado<>'SERVICIO_CERRADO' OR (importe_final_centimos=efectivo_centimos AND saldo_centimos=0)))
  OR (estado NOT IN ('SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO')
    AND servicio_iniciado_en IS NULL AND servicio_terminado_en IS NULL AND servicio_cerrado_en IS NULL)
) IS TRUE);

CREATE OR REPLACE FUNCTION comprobar_bloqueo_reserva() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE identificador uuid; r record; cantidad integer; acordado bigint;
BEGIN
  IF TG_TABLE_NAME='reservas' THEN identificador=COALESCE(NEW.id,OLD.id);
  ELSE identificador=COALESCE(NEW.reserva_id,OLD.reserva_id); END IF;
  SELECT * INTO r FROM reservas WHERE id=identificador;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*) INTO cantidad FROM reservas_bloqueos WHERE reserva_id=r.id AND activo;
  IF r.estado IN ('ACEPTADA','ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','SERVICIO_CONFIRMADO','SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR') THEN
    IF cantidad<>1 OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo
      AND recurso_id=r.recurso_id AND inicio<=r.inicio AND fin=r.fin) THEN
      RAISE EXCEPTION 'Reserva sin bloqueo coherente' USING ERRCODE='23514';
    END IF;
    IF r.estado IN ('SERVICIO_CONFIRMADO','SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR') AND (
      NOT EXISTS(SELECT 1 FROM reservas_cotizaciones WHERE reserva_id=r.id AND decision='ACEPTADA')
      OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo AND inicio=r.inicio AND fin=r.fin)
    ) THEN RAISE EXCEPTION 'Servicio sin cotización aceptada y horario exacto' USING ERRCODE='23514'; END IF;
  ELSIF cantidad<>0 THEN RAISE EXCEPTION 'Estado sin bloqueo permitido' USING ERRCODE='23514'; END IF;
  -- El efectivo de un oficio solo puede ser el total aceptado, nunca otro importe.
  IF r.estado IN ('SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO') THEN
    SELECT importe_centimos INTO acordado FROM reservas_cotizaciones WHERE reserva_id=r.id AND decision='ACEPTADA';
    IF acordado IS NULL OR acordado<>r.efectivo_centimos THEN
      RAISE EXCEPTION 'Efectivo distinto del total aceptado' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NULL;
END $$;

ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA',
   'COTIZACION_PROPUESTA','COTIZACION_ACEPTADA','COTIZACION_RECHAZADA','AGENDA_CONFIRMADA',
   'SERVICIO_INICIADO','SERVICIO_TERMINADO','TERMINO_RECHAZADO','SERVICIO_CERRADO'));
