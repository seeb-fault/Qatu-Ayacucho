ALTER TABLE reservas ADD CONSTRAINT reservas_condiciones_check CHECK (condiciones IS NULL OR (
  tipo_solicitud='alquiler' AND snapshot->>'tipo'='herramienta' AND jsonb_typeof(condiciones)='object'
  AND condiciones->>'politica'='diaria-24h-v1' AND condiciones->>'medioPago'='efectivo'
  AND (condiciones->>'tarifaCentimos')::bigint BETWEEN 1 AND 99999999
  AND (condiciones->>'dias')::bigint>=1
  AND (condiciones->>'importeCentimos')::bigint BETWEEN 1 AND 9007199254740991
  AND (condiciones->>'importeCentimos')::bigint=(condiciones->>'tarifaCentimos')::bigint*(condiciones->>'dias')::bigint
  AND (condiciones->>'toleranciaMinutos')::integer=30 AND (condiciones->>'comisionCentimos')::integer=0
) IS TRUE);

CREATE FUNCTION conservar_acuerdo_reserva() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.condiciones IS DISTINCT FROM OLD.condiciones OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
    OR NEW.cliente_id<>OLD.cliente_id OR NEW.propietario_id<>OLD.propietario_id OR NEW.proveedor_id<>OLD.proveedor_id
    OR NEW.publicacion_id<>OLD.publicacion_id OR NEW.recurso_id<>OLD.recurso_id OR NEW.tipo_solicitud<>OLD.tipo_solicitud
  THEN RAISE EXCEPTION 'El acuerdo y los participantes no se reescriben' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reservas_acuerdo_estable BEFORE UPDATE ON reservas FOR EACH ROW EXECUTE FUNCTION conservar_acuerdo_reserva();
