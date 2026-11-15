-- Evidencias privadas de entrega, devolución o trabajo (006.2). Contenido cifrado con DOCUMENTOS_KEY.
-- Al vencer la retención se borra el contenido y se conservan la metadata y el hash.
CREATE TABLE evidencias (
  id uuid PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  autor_id uuid NOT NULL,
  etapa text NOT NULL CHECK (etapa IN ('entrega','devolucion','trabajo')),
  tipo text NOT NULL CHECK (tipo IN ('image/jpeg','image/png')),
  bytes integer NOT NULL CHECK (bytes BETWEEN 1 AND 5242880),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  contenido bytea,
  iv bytea,
  tag bytea,
  creada_en timestamptz NOT NULL DEFAULT now(),
  eliminada_en timestamptz,
  CHECK ((eliminada_en IS NULL AND contenido IS NOT NULL AND octet_length(iv)=12 AND octet_length(tag)=16)
    OR (eliminada_en IS NOT NULL AND contenido IS NULL AND iv IS NULL AND tag IS NULL))
);
CREATE INDEX evidencias_reserva_etapa ON evidencias (reserva_id, etapa, creada_en);
CREATE INDEX evidencias_vigentes ON evidencias (reserva_id) WHERE eliminada_en IS NULL;
