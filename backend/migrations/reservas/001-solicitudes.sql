-- Identidades externas lógicas: se validan mediante fachadas, sin consultar tablas ajenas.
CREATE TABLE reservas (
  id uuid PRIMARY KEY,
  cliente_id uuid NOT NULL,
  propietario_id uuid NOT NULL,
  proveedor_id uuid NOT NULL,
  publicacion_id uuid NOT NULL,
  recurso_id uuid NOT NULL,
  inicio timestamptz NOT NULL,
  fin timestamptz NOT NULL,
  descripcion_trabajo text NOT NULL CHECK (char_length(descripcion_trabajo) <= 1500),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RECHAZADA')),
  motivo_rechazo text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  creado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (inicio < fin AND isfinite(inicio) AND isfinite(fin)),
  CHECK (cliente_id <> propietario_id),
  CHECK ((estado = 'PENDIENTE' AND motivo_rechazo IS NULL)
    OR (estado = 'RECHAZADA' AND motivo_rechazo IS NOT NULL AND char_length(btrim(motivo_rechazo)) BETWEEN 10 AND 500))
);
CREATE INDEX reservas_cliente ON reservas (cliente_id, creado_en DESC, id DESC);
CREATE INDEX reservas_propietario ON reservas (propietario_id, creado_en DESC, id DESC);
CREATE UNIQUE INDEX reservas_pendiente_duplicada ON reservas (cliente_id, recurso_id, inicio, fin) WHERE estado = 'PENDIENTE';

CREATE TABLE reservas_outbox (
  id uuid PRIMARY KEY,
  agregado_id uuid NOT NULL REFERENCES reservas(id),
  tipo text NOT NULL CHECK (tipo IN ('SOLICITUD_CREADA', 'SOLICITUD_RECHAZADA')),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  creado_en timestamptz NOT NULL DEFAULT now(),
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ENVIADO')),
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  proximo_intento timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservas_outbox_pendientes ON reservas_outbox (proximo_intento) WHERE estado = 'PENDIENTE';
-- PENDIENTE no bloquea disponibilidad. Aceptación, bloqueos y pagos llegan en incrementos posteriores.
