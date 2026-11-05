ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_estado_check;
ALTER TABLE reservas_outbox
  ADD CONSTRAINT reservas_outbox_estado_check CHECK (estado IN ('PENDIENTE','ENVIADO','FALLIDO')),
  -- Se asigna al insertar, bajo el bloqueo de la reserva: conserva el orden real de cada agregado.
  ADD COLUMN secuencia bigserial NOT NULL,
  ADD COLUMN enviado_en timestamptz,
  ADD COLUMN ultimo_error text CHECK (ultimo_error IS NULL OR ultimo_error ~ '^[A-Z0-9_]{1,64}$');
-- Solo hay eventos enviados si se revirtió y se vuelve a aplicar: la hora real se perdió al revertir.
UPDATE reservas_outbox SET enviado_en=creado_en WHERE estado='ENVIADO';
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_enviado_check CHECK ((estado='ENVIADO')=(enviado_en IS NOT NULL));
CREATE INDEX reservas_outbox_agregado_pendiente ON reservas_outbox (agregado_id, secuencia) WHERE estado='PENDIENTE';
