-- Rollback manual: no se descartan alquileres, eventos o importes reales para volver a 005.1.
-- Primero resolver/exportar operaciones y retirar eventos nuevos mediante un procedimiento de operador.
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM reservas WHERE estado NOT IN ('PENDIENTE','RECHAZADA') OR condiciones IS NOT NULL OR tipo_solicitud<>'alquiler')
    OR EXISTS(SELECT 1 FROM reservas_outbox WHERE tipo NOT IN ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA'))
  THEN RAISE EXCEPTION 'Rollback bloqueado: conserva operaciones de alquiler/efectivo.'; END IF;
END $$;
DROP TRIGGER reservas_bloqueo_coherente ON reservas;
DROP TABLE reservas_bloqueos;
DROP FUNCTION comprobar_bloqueo_reserva();
DROP INDEX reservas_posesion_unica;
DROP INDEX reservas_a_vencer;
ALTER TABLE reservas DROP CONSTRAINT reservas_estado_check, DROP CONSTRAINT reservas_rechazo_check,
  DROP CONSTRAINT reservas_vencimiento_check, DROP CONSTRAINT reservas_efectivo_check,
  DROP CONSTRAINT reservas_devolucion_check, DROP CONSTRAINT reservas_visita_check;
ALTER TABLE reservas DROP COLUMN tipo_solicitud, DROP COLUMN condiciones, DROP COLUMN vence_en,
  DROP COLUMN pago_estado, DROP COLUMN efectivo_centimos, DROP COLUMN entregado_en, DROP COLUMN recibido_en,
  DROP COLUMN devolucion_informada_en, DROP COLUMN devuelto_en, DROP COLUMN importe_final_centimos,
  DROP COLUMN saldo_centimos, DROP COLUMN dias_extra, DROP COLUMN motivo_operacion;
CREATE UNIQUE INDEX reservas_pendiente_duplicada ON reservas(cliente_id,recurso_id,inicio,fin) WHERE estado='PENDIENTE';
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check CHECK (estado IN ('PENDIENTE','RECHAZADA')),
  ADD CONSTRAINT reservas_rechazo_check CHECK ((estado='PENDIENTE' AND motivo_rechazo IS NULL) OR (estado='RECHAZADA' AND motivo_rechazo IS NOT NULL AND char_length(btrim(motivo_rechazo)) BETWEEN 10 AND 500));
ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA'));
