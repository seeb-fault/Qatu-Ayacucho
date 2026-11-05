CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE reservas DROP CONSTRAINT reservas_estado_check;
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='reservas'::regclass AND contype='c'
    AND pg_get_constraintdef(oid) LIKE '%motivo_rechazo%'
  LOOP EXECUTE format('ALTER TABLE reservas DROP CONSTRAINT %I',c.conname); END LOOP;
END $$;
ALTER TABLE reservas
  ADD COLUMN tipo_solicitud text NOT NULL DEFAULT 'alquiler' CHECK (tipo_solicitud IN ('alquiler','visita')),
  ADD COLUMN condiciones jsonb,
  ADD COLUMN vence_en timestamptz,
  ADD COLUMN pago_estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (pago_estado IN ('PENDIENTE','REGISTRADO_PROVEEDOR','CONFIRMADO_PARTICIPANTES')),
  ADD COLUMN efectivo_centimos bigint NOT NULL DEFAULT 0 CHECK (efectivo_centimos BETWEEN 0 AND 9007199254740991),
  ADD COLUMN entregado_en timestamptz,
  ADD COLUMN recibido_en timestamptz,
  ADD COLUMN devolucion_informada_en timestamptz,
  ADD COLUMN devuelto_en timestamptz,
  ADD COLUMN importe_final_centimos bigint CHECK (importe_final_centimos BETWEEN 1 AND 9007199254740991),
  ADD COLUMN saldo_centimos bigint NOT NULL DEFAULT 0 CHECK (saldo_centimos BETWEEN 0 AND 9007199254740991),
  ADD COLUMN dias_extra integer NOT NULL DEFAULT 0 CHECK (dias_extra >= 0),
  ADD COLUMN motivo_operacion text CHECK (motivo_operacion IS NULL OR char_length(btrim(motivo_operacion)) BETWEEN 10 AND 500),
  ADD CONSTRAINT reservas_estado_check CHECK (estado IN ('PENDIENTE','RECHAZADA','VISITA_ACORDADA','ACEPTADA','VENCIDA','CANCELADA','ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA')),
  ADD CONSTRAINT reservas_rechazo_check CHECK ((estado='RECHAZADA' AND motivo_rechazo IS NOT NULL AND char_length(btrim(motivo_rechazo)) BETWEEN 10 AND 500) OR (estado<>'RECHAZADA' AND motivo_rechazo IS NULL)),
  ADD CONSTRAINT reservas_vencimiento_check CHECK ((estado='ACEPTADA' AND vence_en IS NOT NULL AND isfinite(vence_en) AND vence_en<=fin AND condiciones IS NOT NULL) OR (estado<>'ACEPTADA' AND vence_en IS NULL)),
  ADD CONSTRAINT reservas_efectivo_check CHECK (
    (estado IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA') AND tipo_solicitud='alquiler'
      AND condiciones IS NOT NULL AND efectivo_centimos>0 AND efectivo_centimos=(condiciones->>'importeCentimos')::bigint AND entregado_en IS NOT NULL
      AND ((estado='ENTREGA_POR_CONFIRMAR' AND pago_estado='REGISTRADO_PROVEEDOR' AND recibido_en IS NULL)
        OR (estado<>'ENTREGA_POR_CONFIRMAR' AND pago_estado='CONFIRMADO_PARTICIPANTES' AND recibido_en IS NOT NULL)))
    OR (estado NOT IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA') AND pago_estado='PENDIENTE' AND efectivo_centimos=0)),
  ADD CONSTRAINT reservas_devolucion_check CHECK (estado<>'DEVUELTA' OR (devuelto_en IS NOT NULL AND importe_final_centimos IS NOT NULL AND importe_final_centimos=efectivo_centimos+saldo_centimos)),
  ADD CONSTRAINT reservas_visita_check CHECK (estado<>'VISITA_ACORDADA' OR (tipo_solicitud='visita' AND condiciones IS NULL));
DROP INDEX reservas_pendiente_duplicada;
CREATE UNIQUE INDEX reservas_pendiente_duplicada ON reservas(cliente_id,recurso_id,inicio,fin,tipo_solicitud) WHERE estado='PENDIENTE';
CREATE UNIQUE INDEX reservas_posesion_unica ON reservas(recurso_id) WHERE estado IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE');
CREATE INDEX reservas_a_vencer ON reservas(vence_en) WHERE estado='ACEPTADA';

CREATE TABLE reservas_bloqueos (
  reserva_id uuid PRIMARY KEY REFERENCES reservas(id), recurso_id uuid NOT NULL,
  inicio timestamptz NOT NULL, fin timestamptz NOT NULL, activo boolean NOT NULL DEFAULT true,
  CHECK (inicio<fin AND isfinite(inicio) AND isfinite(fin)),
  CONSTRAINT reservas_sin_solapamiento EXCLUDE USING gist
    (recurso_id WITH =, tstzrange(inicio,fin,'[)') WITH &&) WHERE (activo)
);

CREATE FUNCTION comprobar_bloqueo_reserva() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE identificador uuid; r record; cantidad integer;
BEGIN
  IF TG_TABLE_NAME='reservas' THEN identificador=COALESCE(NEW.id,OLD.id);
  ELSE identificador=COALESCE(NEW.reserva_id,OLD.reserva_id); END IF;
  SELECT * INTO r FROM reservas WHERE id=identificador;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*) INTO cantidad FROM reservas_bloqueos WHERE reserva_id=r.id AND activo;
  IF r.estado IN ('ACEPTADA','ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE') THEN
    IF cantidad<>1 OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo AND recurso_id=r.recurso_id AND inicio<=r.inicio AND fin=r.fin) THEN
      RAISE EXCEPTION 'Reserva sin bloqueo coherente' USING ERRCODE='23514';
    END IF;
  ELSIF cantidad<>0 THEN RAISE EXCEPTION 'Estado sin bloqueo permitido' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER reservas_bloqueo_coherente AFTER INSERT OR UPDATE ON reservas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_bloqueo_reserva();
CREATE CONSTRAINT TRIGGER bloqueos_reserva_coherente AFTER INSERT OR UPDATE OR DELETE ON reservas_bloqueos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION comprobar_bloqueo_reserva();

ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA'));
