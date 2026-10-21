CREATE TABLE usuarios (
  id uuid PRIMARY KEY,
  email_normalizado text NOT NULL UNIQUE CHECK (email_normalizado = lower(btrim(email_normalizado))),
  password_hash text NOT NULL,
  nombre text NOT NULL CHECK (length(btrim(nombre)) BETWEEN 2 AND 100),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE roles_usuario (
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  rol text NOT NULL CHECK (rol IN ('cliente', 'proveedor', 'admin')),
  PRIMARY KEY (usuario_id, rol)
);

CREATE TABLE sesiones_usuario (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  expira_en timestamptz NOT NULL,
  revocada boolean NOT NULL DEFAULT false
);
CREATE INDEX sesiones_usuario_usuario_idx ON sesiones_usuario(usuario_id);

CREATE TABLE limites_acceso (
  clave text PRIMARY KEY,
  intentos integer NOT NULL,
  hasta timestamptz NOT NULL
);
