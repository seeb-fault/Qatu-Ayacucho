-- Incidencias y garantía documental (006.3). Ninguna de las dos mueve ni custodia dinero.

-- Reclamo de un participante. Lo resuelve un administrador ajeno a la operación; la resolución no se edita.
CREATE TABLE incidencias (
  id uuid PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  autor_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  propietario_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('dano','faltante','servicio','otro')),
  descripcion text NOT NULL CHECK (length(btrim(descripcion)) BETWEEN 20 AND 1000),
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','resuelta')),
  resultado text CHECK (resultado IN ('a_favor_cliente','a_favor_proveedor','sin_acuerdo')),
  motivo text CHECK (motivo IS NULL OR length(btrim(motivo)) BETWEEN 10 AND 500),
  revisor_id uuid,
  creada_en timestamptz NOT NULL DEFAULT now(),
  resuelta_en timestamptz,
  CHECK ((estado = 'abierta' AND resultado IS NULL AND motivo IS NULL AND revisor_id IS NULL AND resuelta_en IS NULL)
    OR (estado = 'resuelta' AND resultado IS NOT NULL AND motivo IS NOT NULL AND revisor_id IS NOT NULL AND resuelta_en IS NOT NULL)),
  CHECK (revisor_id IS NULL OR revisor_id NOT IN (cliente_id, propietario_id))
);
CREATE UNIQUE INDEX incidencias_una_abierta ON incidencias (reserva_id) WHERE estado = 'abierta';
CREATE INDEX incidencias_por_estado ON incidencias (estado, creada_en DESC);

-- Acuerdo escrito del estado de la herramienta y sus accesorios. Sin monto: no es un depósito.
CREATE TABLE garantias_documentadas (
  reserva_id uuid PRIMARY KEY REFERENCES reservas(id),
  condiciones text NOT NULL CHECK (length(btrim(condiciones)) BETWEEN 20 AND 1000),
  registrada_por uuid NOT NULL,
  registrada_en timestamptz NOT NULL DEFAULT now(),
  conformidad_cliente_en timestamptz,
  version integer NOT NULL DEFAULT 1
);
