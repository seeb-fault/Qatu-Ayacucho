-- Reseñas de clientes sobre operaciones cerradas (006.1). Una por reserva; las ocultas no cuentan en el promedio.
CREATE TABLE resenas (
  id uuid PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  cliente_id uuid NOT NULL,
  propietario_id uuid NOT NULL,
  proveedor_id uuid NOT NULL,
  publicacion_id uuid NOT NULL,
  titulo text NOT NULL CHECK (length(titulo) BETWEEN 1 AND 160),
  puntuacion smallint NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  texto text CHECK (texto IS NULL OR length(texto) BETWEEN 1 AND 600),
  oculta boolean NOT NULL DEFAULT false,
  creada_en timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT resenas_una_por_reserva UNIQUE (reserva_id),
  CHECK (cliente_id <> propietario_id)
);
CREATE INDEX resenas_publicas_proveedor ON resenas (proveedor_id, creada_en DESC) WHERE NOT oculta;

-- Cada decisión de moderación queda registrada; no se borra ni se edita.
CREATE TABLE resenas_moderaciones (
  id uuid PRIMARY KEY,
  resena_id uuid NOT NULL REFERENCES resenas(id),
  admin_id uuid NOT NULL,
  oculta boolean NOT NULL,
  motivo text NOT NULL CHECK (length(motivo) BETWEEN 10 AND 500),
  creada_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resenas_moderaciones_resena ON resenas_moderaciones (resena_id, creada_en DESC);
