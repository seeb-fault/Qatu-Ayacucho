CREATE TABLE zonas_proveedor (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO zonas_proveedor(id,nombre) VALUES
  ('ayacucho','Ayacucho'),
  ('san-juan-bautista','San Juan Bautista'),
  ('carmen-alto','Carmen Alto'),
  ('jesus-nazareno','Jesús Nazareno');

CREATE TABLE proveedores (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL UNIQUE REFERENCES usuarios(id),
  nombre_publico text NOT NULL CHECK (length(btrim(nombre_publico)) BETWEEN 2 AND 100),
  descripcion text NOT NULL CHECK (length(btrim(descripcion)) BETWEEN 20 AND 1500),
  zona_id text NOT NULL REFERENCES zonas_proveedor(id),
  visible_publicamente boolean NOT NULL DEFAULT false,
  estado_verificacion text NOT NULL DEFAULT 'no_solicitada' CHECK (estado_verificacion IN ('no_solicitada')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
