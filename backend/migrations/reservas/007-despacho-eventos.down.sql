-- Los eventos fallidos vuelven a pendientes para no perderlos; los consumidores deduplican por id.
DROP INDEX reservas_outbox_agregado_pendiente;
ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_enviado_check;
ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_estado_check;
UPDATE reservas_outbox SET estado='PENDIENTE' WHERE estado='FALLIDO';
ALTER TABLE reservas_outbox
  DROP COLUMN ultimo_error,
  DROP COLUMN enviado_en,
  DROP COLUMN secuencia,
  ADD CONSTRAINT reservas_outbox_estado_check CHECK (estado IN ('PENDIENTE','ENVIADO'));
