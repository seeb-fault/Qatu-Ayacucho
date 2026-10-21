ALTER TABLE proveedores DROP CONSTRAINT proveedores_estado_verificacion_check;
ALTER TABLE proveedores ADD CONSTRAINT proveedores_estado_verificacion_check CHECK (estado_verificacion IN ('no_solicitada','pendiente','aprobada','rechazada'));

CREATE TABLE verificaciones_proveedor (
  id uuid PRIMARY KEY,
  proveedor_id uuid NOT NULL REFERENCES proveedores(id),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  politica_conservacion text NOT NULL DEFAULT 'cuenta_activa_v1' CHECK (politica_conservacion='cuenta_activa_v1'),
  perfil_enviado jsonb NOT NULL CHECK (jsonb_typeof(perfil_enviado)='object'),
  motivo text CHECK (length(btrim(motivo)) BETWEEN 10 AND 500),
  revisor_id uuid REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  revisado_en timestamptz,
  CHECK ((estado='pendiente' AND motivo IS NULL AND revisor_id IS NULL AND revisado_en IS NULL)
    OR (estado IN ('aprobada','rechazada') AND motivo IS NOT NULL AND revisor_id IS NOT NULL AND revisado_en IS NOT NULL)
    OR (estado='cancelada' AND motivo IS NOT NULL AND revisor_id IS NULL AND revisado_en IS NOT NULL))
);
CREATE UNIQUE INDEX una_verificacion_pendiente ON verificaciones_proveedor(proveedor_id) WHERE estado='pendiente';
CREATE INDEX verificaciones_proveedor_fecha_idx ON verificaciones_proveedor(proveedor_id,creado_en DESC,id DESC);

CREATE TABLE documentos_proveedor (
  id uuid PRIMARY KEY,
  verificacion_id uuid NOT NULL REFERENCES verificaciones_proveedor(id),
  tipo text NOT NULL CHECK (tipo IN ('application/pdf','image/jpeg','image/png')),
  bytes integer NOT NULL CHECK (bytes BETWEEN 1 AND 5242880),
  sha256 text NOT NULL CHECK (length(sha256)=64),
  contenido bytea,
  iv bytea,
  tag bytea,
  eliminado_en timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now(),
  CHECK ((eliminado_en IS NULL AND contenido IS NOT NULL AND iv IS NOT NULL AND tag IS NOT NULL AND octet_length(iv)=12 AND octet_length(tag)=16)
    OR (eliminado_en IS NOT NULL AND contenido IS NULL AND iv IS NULL AND tag IS NULL))
);
CREATE INDEX documentos_verificacion_idx ON documentos_proveedor(verificacion_id);
