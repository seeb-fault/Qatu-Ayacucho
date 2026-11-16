-- 012: Libro de Reclamaciones virtual (Código de Protección y Defensa del Consumidor, Ley 29571; Reglamento DS 011-2011-PCM
-- modificado por DS 101-2022-PCM). Cada hoja guarda el titular vigente al presentarla y nunca se borra ni se edita:
-- solo se le agrega la respuesta.

CREATE TABLE reclamaciones_correlativo (
  anio integer PRIMARY KEY CHECK (anio BETWEEN 2026 AND 2999),
  ultimo integer NOT NULL CHECK (ultimo > 0)
);

CREATE TABLE reclamaciones_hojas (
  id uuid PRIMARY KEY,
  numero text NOT NULL UNIQUE CHECK (numero ~ '^LR-[0-9]{4}-[0-9]{6}$'),
  codigo_consulta_hash text NOT NULL CHECK (length(codigo_consulta_hash) = 64),
  tipo text NOT NULL CHECK (tipo IN ('reclamo', 'queja')),
  -- Titular de Qatu al momento de presentar la hoja (puede faltar mientras no se configure).
  titular jsonb NOT NULL,
  -- Consumidor
  usuario_id uuid,
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 3 AND 150),
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('DNI', 'CE', 'PASAPORTE', 'RUC')),
  numero_documento text NOT NULL CHECK (numero_documento ~ '^[A-Z0-9]{6,12}$'),
  domicilio text NOT NULL CHECK (char_length(domicilio) BETWEEN 5 AND 200),
  telefono text CHECK (telefono IS NULL OR telefono ~ '^9[0-9]{8}$'),
  email text NOT NULL CHECK (char_length(email) BETWEEN 6 AND 254),
  medio_respuesta text NOT NULL CHECK (medio_respuesta IN ('correo', 'carta')),
  menor_de_edad boolean NOT NULL DEFAULT false,
  apoderado_nombre text,
  apoderado_documento text,
  -- Bien contratado
  bien_tipo text NOT NULL CHECK (bien_tipo IN ('producto', 'servicio')),
  bien_descripcion text NOT NULL CHECK (char_length(bien_descripcion) BETWEEN 5 AND 300),
  monto_centimos integer CHECK (monto_centimos IS NULL OR monto_centimos BETWEEN 0 AND 100000000),
  -- Detalle
  detalle text NOT NULL CHECK (char_length(detalle) BETWEEN 20 AND 2000),
  pedido text NOT NULL CHECK (char_length(pedido) BETWEEN 10 AND 1000),
  presentada_en timestamptz NOT NULL DEFAULT now(),
  vence_en date NOT NULL,
  -- Respuesta del proveedor (Qatu)
  respuesta text CHECK (respuesta IS NULL OR char_length(respuesta) BETWEEN 20 AND 4000),
  respuesta_medio text CHECK (respuesta_medio IS NULL OR respuesta_medio IN ('correo', 'carta')),
  respondida_en timestamptz,
  respondida_por uuid,
  CHECK (menor_de_edad = (apoderado_nombre IS NOT NULL) AND menor_de_edad = (apoderado_documento IS NOT NULL)),
  CHECK ((respuesta IS NULL) = (respondida_en IS NULL) AND (respuesta IS NULL) = (respuesta_medio IS NULL) AND (respuesta IS NULL) = (respondida_por IS NULL))
);

CREATE INDEX reclamaciones_hojas_pendientes ON reclamaciones_hojas (vence_en) WHERE respuesta IS NULL;
CREATE INDEX reclamaciones_hojas_presentadas ON reclamaciones_hojas (presentada_en DESC);
