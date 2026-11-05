ALTER TABLE reservas DROP CONSTRAINT reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check CHECK (estado IN
  ('PENDIENTE','RECHAZADA','VISITA_ACORDADA','ACEPTADA','VENCIDA','CANCELADA',
   'ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA','SERVICIO_CONFIRMADO'));
ALTER TABLE reservas ADD CONSTRAINT reservas_servicio_confirmado_check CHECK ((estado<>'SERVICIO_CONFIRMADO' OR (
  snapshot->>'tipo'='servicio' AND tipo_solicitud='alquiler' AND condiciones IS NULL
  AND vence_en IS NULL AND pago_estado='PENDIENTE' AND efectivo_centimos=0
)) IS TRUE);

CREATE OR REPLACE FUNCTION comprobar_bloqueo_reserva() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE identificador uuid; r record; cantidad integer;
BEGIN
  IF TG_TABLE_NAME='reservas' THEN identificador=COALESCE(NEW.id,OLD.id);
  ELSE identificador=COALESCE(NEW.reserva_id,OLD.reserva_id); END IF;
  SELECT * INTO r FROM reservas WHERE id=identificador;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*) INTO cantidad FROM reservas_bloqueos WHERE reserva_id=r.id AND activo;
  IF r.estado IN ('ACEPTADA','ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','SERVICIO_CONFIRMADO') THEN
    IF cantidad<>1 OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo
      AND recurso_id=r.recurso_id AND inicio<=r.inicio AND fin=r.fin) THEN
      RAISE EXCEPTION 'Reserva sin bloqueo coherente' USING ERRCODE='23514';
    END IF;
    IF r.estado='SERVICIO_CONFIRMADO' AND (
      NOT EXISTS(SELECT 1 FROM reservas_cotizaciones WHERE reserva_id=r.id AND decision='ACEPTADA')
      OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo AND inicio=r.inicio AND fin=r.fin)
    ) THEN RAISE EXCEPTION 'Servicio sin cotización aceptada y horario exacto' USING ERRCODE='23514'; END IF;
  ELSIF cantidad<>0 THEN RAISE EXCEPTION 'Estado sin bloqueo permitido' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER cotizaciones_agenda_coherente AFTER INSERT OR UPDATE OR DELETE ON reservas_cotizaciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_bloqueo_reserva();

ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA',
   'COTIZACION_PROPUESTA','COTIZACION_ACEPTADA','COTIZACION_RECHAZADA','AGENDA_CONFIRMADA'));
-- Los acuerdos aceptados con 005.3 conservan PENDIENTE hasta confirmar expresamente su agenda.
