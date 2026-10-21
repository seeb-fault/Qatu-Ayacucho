CREATE TABLE auditoria_usuarios (
  id uuid PRIMARY KEY,
  actor_id uuid REFERENCES usuarios(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  accion text NOT NULL CHECK (accion IN ('crear_admin', 'cambiar_estado')),
  estado_anterior text CHECK (estado_anterior IN ('activo', 'inactivo')),
  estado_nuevo text NOT NULL CHECK (estado_nuevo IN ('activo', 'inactivo')),
  motivo text NOT NULL CHECK (length(btrim(motivo)) BETWEEN 10 AND 500),
  creado_en timestamptz NOT NULL DEFAULT now(),
  CHECK ((accion = 'crear_admin' AND actor_id IS NULL AND estado_anterior IS NULL)
    OR (accion = 'cambiar_estado' AND actor_id IS NOT NULL AND estado_anterior IS NOT NULL AND estado_anterior <> estado_nuevo))
);
CREATE INDEX auditoria_usuarios_usuario_fecha_idx ON auditoria_usuarios(usuario_id, creado_en DESC, id DESC);
