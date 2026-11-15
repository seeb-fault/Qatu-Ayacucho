-- Mi lista (009): borradores de solicitud del cliente. No bloquean fechas ni avisan al proveedor.
CREATE TABLE reservas_lista_items (
  id uuid PRIMARY KEY,
  cliente_id uuid NOT NULL,
  publicacion_id uuid NOT NULL,
  recurso_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('herramienta','servicio')),
  inicio timestamptz NOT NULL,
  fin timestamptz NOT NULL,
  descripcion text NOT NULL DEFAULT '' CHECK (char_length(descripcion) <= 1500),
  tarifa_vista_centimos bigint CHECK (tarifa_vista_centimos IS NULL OR tarifa_vista_centimos > 0),
  creado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (fin > inicio),
  CHECK (tipo <> 'servicio' OR char_length(descripcion) >= 20)
);
-- Sin duplicados exactos: misma unidad y mismo intervalo.
CREATE UNIQUE INDEX reservas_lista_unica ON reservas_lista_items (cliente_id, publicacion_id, recurso_id, inicio, fin);
CREATE INDEX reservas_lista_cliente ON reservas_lista_items (cliente_id, creado_en);

-- Un envío por clave de idempotencia: repetirlo devuelve el mismo resultado.
CREATE TABLE reservas_lista_envios (
  cliente_id uuid NOT NULL,
  clave text NOT NULL CHECK (clave ~ '^[A-Za-z0-9_-]{16,64}$'),
  huella text NOT NULL,
  resultados jsonb,
  creado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cliente_id, clave)
);
