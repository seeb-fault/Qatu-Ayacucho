CREATE TABLE reservas_avisos (
  id uuid PRIMARY KEY,
  evento_id uuid NOT NULL REFERENCES reservas_outbox(id),
  usuario_id uuid NOT NULL,
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  tipo text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  leido_en timestamptz,
  -- Un evento reentregado no genera un segundo aviso para la misma persona.
  CONSTRAINT reservas_avisos_unico UNIQUE (evento_id, usuario_id)
);
CREATE INDEX reservas_avisos_usuario ON reservas_avisos (usuario_id, creado_en DESC, id DESC);
CREATE INDEX reservas_avisos_sin_leer ON reservas_avisos (usuario_id) WHERE leido_en IS NULL;

-- Los eventos anteriores a este canal no se convierten en avisos: serían noticias antiguas en bloque.
UPDATE reservas_outbox SET estado='FALLIDO', ultimo_error='ANTERIOR_A_AVISOS' WHERE estado='PENDIENTE';
