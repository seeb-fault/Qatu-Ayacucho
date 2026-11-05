CREATE TABLE reservas_cotizaciones (
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  version integer NOT NULL CHECK (version > 0),
  alcance text NOT NULL CHECK (char_length(btrim(alcance)) BETWEEN 20 AND 1500),
  materiales text NOT NULL CHECK (char_length(btrim(materiales)) BETWEEN 10 AND 1000),
  importe_centimos integer NOT NULL CHECK (importe_centimos BETWEEN 1 AND 99999999),
  moneda text NOT NULL DEFAULT 'PEN' CHECK (moneda='PEN'),
  vigente_hasta timestamptz NOT NULL CHECK (isfinite(vigente_hasta)),
  creada_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  decision text CHECK (decision IN ('ACEPTADA','RECHAZADA')),
  motivo text,
  respondida_en timestamptz,
  PRIMARY KEY (reserva_id,version),
  CHECK (vigente_hasta>creada_en),
  CHECK (((decision IS NULL AND motivo IS NULL AND respondida_en IS NULL)
    OR (decision='ACEPTADA' AND motivo IS NULL AND respondida_en IS NOT NULL AND respondida_en<vigente_hasta)
    OR (decision='RECHAZADA' AND char_length(btrim(motivo)) BETWEEN 10 AND 500 AND respondida_en IS NOT NULL AND respondida_en<vigente_hasta)) IS TRUE)
);
CREATE UNIQUE INDEX reservas_cotizacion_aceptada ON reservas_cotizaciones(reserva_id) WHERE decision='ACEPTADA';
CREATE FUNCTION conservar_cotizacion_reserva() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Las cotizaciones se conservan' USING ERRCODE='23514'; END IF;
  IF OLD.decision IS NOT NULL OR NEW.reserva_id<>OLD.reserva_id OR NEW.version<>OLD.version
    OR NEW.alcance<>OLD.alcance OR NEW.materiales<>OLD.materiales OR NEW.importe_centimos<>OLD.importe_centimos
    OR NEW.moneda<>OLD.moneda OR NEW.vigente_hasta<>OLD.vigente_hasta OR NEW.creada_en<>OLD.creada_en
    OR NEW.decision IS NULL
  THEN RAISE EXCEPTION 'La propuesta y su respuesta son inmutables' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cotizaciones_estables BEFORE UPDATE OR DELETE ON reservas_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION conservar_cotizacion_reserva();
ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA',
   'COTIZACION_PROPUESTA','COTIZACION_ACEPTADA','COTIZACION_RECHAZADA'));
