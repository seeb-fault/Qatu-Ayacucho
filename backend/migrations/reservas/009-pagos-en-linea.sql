ALTER TABLE reservas ADD COLUMN pagado_en_linea_centimos bigint NOT NULL DEFAULT 0 CHECK (pagado_en_linea_centimos BETWEEN 0 AND 9007199254740991);

ALTER TABLE reservas DROP CONSTRAINT reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check CHECK (estado IN
  ('PENDIENTE','RECHAZADA','VISITA_ACORDADA','ACEPTADA','VENCIDA','CANCELADA',
   'ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA','SERVICIO_CONFIRMADO',
   'SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO','APARTADO_PAGADO','SERVICIO_POR_PAGAR'));

ALTER TABLE reservas DROP CONSTRAINT reservas_pago_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_pago_estado_check CHECK (pago_estado IN ('PENDIENTE','REGISTRADO_PROVEEDOR','CONFIRMADO_PARTICIPANTES','PAGADO_EN_LINEA'));

ALTER TABLE reservas DROP CONSTRAINT reservas_efectivo_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_efectivo_check CHECK (
  (estado IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA') AND tipo_solicitud='alquiler'
    AND condiciones IS NOT NULL AND entregado_en IS NOT NULL AND (
      (efectivo_centimos>0 AND efectivo_centimos=(condiciones->>'importeCentimos')::bigint AND pagado_en_linea_centimos=0
        AND ((estado='ENTREGA_POR_CONFIRMAR' AND pago_estado='REGISTRADO_PROVEEDOR' AND recibido_en IS NULL)
          OR (estado<>'ENTREGA_POR_CONFIRMAR' AND pago_estado='CONFIRMADO_PARTICIPANTES' AND recibido_en IS NOT NULL)))
      OR (pago_estado='PAGADO_EN_LINEA' AND efectivo_centimos=0 AND pagado_en_linea_centimos=(condiciones->>'importeCentimos')::bigint
        AND (estado='ENTREGA_POR_CONFIRMAR')=(recibido_en IS NULL))))
  OR (estado='APARTADO_PAGADO' AND condiciones IS NOT NULL AND pago_estado='PAGADO_EN_LINEA' AND efectivo_centimos=0
    AND pagado_en_linea_centimos=(condiciones->>'importeCentimos')::bigint)
  OR (estado='SERVICIO_POR_CONFIRMAR' AND pago_estado='REGISTRADO_PROVEEDOR' AND efectivo_centimos>0 AND pagado_en_linea_centimos=0)
  OR (estado='SERVICIO_CERRADO' AND ((pago_estado='CONFIRMADO_PARTICIPANTES' AND efectivo_centimos>0 AND pagado_en_linea_centimos=0)
    OR (pago_estado='PAGADO_EN_LINEA' AND pagado_en_linea_centimos>0 AND efectivo_centimos=0)))
  OR (estado='CANCELADA' AND pago_estado='PAGADO_EN_LINEA' AND pagado_en_linea_centimos>0 AND efectivo_centimos=0)
  OR (estado NOT IN ('ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','DEVUELTA','APARTADO_PAGADO','SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO')
    AND pago_estado='PENDIENTE' AND efectivo_centimos=0 AND pagado_en_linea_centimos=0));

ALTER TABLE reservas DROP CONSTRAINT reservas_devolucion_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_devolucion_check CHECK (estado<>'DEVUELTA' OR (devuelto_en IS NOT NULL
  AND importe_final_centimos IS NOT NULL AND importe_final_centimos=efectivo_centimos+pagado_en_linea_centimos+saldo_centimos));

ALTER TABLE reservas DROP CONSTRAINT reservas_ejecucion_servicio_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_ejecucion_servicio_check CHECK ((
  (estado IN ('SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_POR_PAGAR','SERVICIO_CERRADO')
    AND snapshot->>'tipo'='servicio' AND tipo_solicitud='alquiler' AND condiciones IS NULL AND vence_en IS NULL
    AND servicio_iniciado_en IS NOT NULL
    AND (estado='SERVICIO_EN_CURSO')=(servicio_terminado_en IS NULL)
    AND (estado='SERVICIO_CERRADO')=(servicio_cerrado_en IS NOT NULL)
    AND (estado<>'SERVICIO_CERRADO' OR (importe_final_centimos=efectivo_centimos+pagado_en_linea_centimos AND saldo_centimos=0)))
  OR (estado NOT IN ('SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_POR_PAGAR','SERVICIO_CERRADO')
    AND servicio_iniciado_en IS NULL AND servicio_terminado_en IS NULL AND servicio_cerrado_en IS NULL)
) IS TRUE);

CREATE OR REPLACE FUNCTION comprobar_bloqueo_reserva() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE identificador uuid; r record; cantidad integer; acordado bigint;
BEGIN
  IF TG_TABLE_NAME='reservas' THEN identificador=COALESCE(NEW.id,OLD.id);
  ELSE identificador=COALESCE(NEW.reserva_id,OLD.reserva_id); END IF;
  SELECT * INTO r FROM reservas WHERE id=identificador;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*) INTO cantidad FROM reservas_bloqueos WHERE reserva_id=r.id AND activo;
  IF r.estado IN ('ACEPTADA','APARTADO_PAGADO','ENTREGA_POR_CONFIRMAR','EN_CURSO','DEVOLUCION_PENDIENTE','SERVICIO_CONFIRMADO','SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_POR_PAGAR') THEN
    IF cantidad<>1 OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo
      AND recurso_id=r.recurso_id AND inicio<=r.inicio AND fin=r.fin) THEN
      RAISE EXCEPTION 'Reserva sin bloqueo coherente' USING ERRCODE='23514';
    END IF;
    IF r.estado IN ('SERVICIO_CONFIRMADO','SERVICIO_EN_CURSO','SERVICIO_POR_CONFIRMAR','SERVICIO_POR_PAGAR') AND (
      NOT EXISTS(SELECT 1 FROM reservas_cotizaciones WHERE reserva_id=r.id AND decision='ACEPTADA')
      OR NOT EXISTS(SELECT 1 FROM reservas_bloqueos WHERE reserva_id=r.id AND activo AND inicio=r.inicio AND fin=r.fin)
    ) THEN RAISE EXCEPTION 'Servicio sin cotización aceptada y horario exacto' USING ERRCODE='23514'; END IF;
  ELSIF cantidad<>0 THEN RAISE EXCEPTION 'Estado sin bloqueo permitido' USING ERRCODE='23514'; END IF;
  -- Lo pagado por un oficio, en efectivo o en línea, solo puede ser el total aceptado.
  IF r.estado IN ('SERVICIO_POR_CONFIRMAR','SERVICIO_CERRADO') THEN
    SELECT importe_centimos INTO acordado FROM reservas_cotizaciones WHERE reserva_id=r.id AND decision='ACEPTADA';
    IF acordado IS NULL OR acordado<>r.efectivo_centimos+r.pagado_en_linea_centimos THEN
      RAISE EXCEPTION 'Pago distinto del total aceptado' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NULL;
END $$;

ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA',
   'COTIZACION_PROPUESTA','COTIZACION_ACEPTADA','COTIZACION_RECHAZADA','AGENDA_CONFIRMADA',
   'SERVICIO_INICIADO','SERVICIO_TERMINADO','TERMINO_RECHAZADO','SERVICIO_CERRADO',
   'PAGO_APROBADO','REEMBOLSO_PENDIENTE','ENTREGA_REGISTRADA','COBRO_SOLICITADO'));

CREATE TABLE reservas_pagos (
  id uuid PRIMARY KEY,
  reserva_id uuid NOT NULL REFERENCES reservas(id),
  cliente_id uuid NOT NULL,
  clave text NOT NULL CHECK (clave ~ '^[A-Za-z0-9_-]{16,64}$'),
  -- Huella del token: detecta una clave reutilizada con otro pago sin guardar el token.
  huella text NOT NULL CHECK (huella ~ '^[a-f0-9]{64}$'),
  importe_centimos bigint NOT NULL CHECK (importe_centimos BETWEEN 1 AND 9007199254740991),
  moneda text NOT NULL DEFAULT 'PEN' CHECK (moneda='PEN'),
  estado text NOT NULL DEFAULT 'PROCESANDO' CHECK (estado IN ('PROCESANDO','APROBADO','RECHAZADO','DESCONOCIDO')),
  referencia text UNIQUE CHECK (referencia IS NULL OR referencia ~ '^[A-Za-z0-9_-]{1,64}$'),
  codigo text CHECK (codigo IS NULL OR codigo ~ '^[A-Z0-9_]{1,64}$'),
  reembolso_pendiente boolean NOT NULL DEFAULT false,
  reembolso_motivo text CHECK (reembolso_motivo IS NULL OR reembolso_motivo ~ '^[A-Z0-9_]{1,64}$'),
  creado_en timestamptz NOT NULL DEFAULT now(),
  resuelto_en timestamptz,
  CONSTRAINT reservas_pagos_clave UNIQUE (cliente_id, clave),
  CHECK ((estado='APROBADO')=(referencia IS NOT NULL)),
  CHECK ((estado IN ('PROCESANDO','DESCONOCIDO'))=(resuelto_en IS NULL)),
  CHECK (reembolso_pendiente=(reembolso_motivo IS NOT NULL)),
  CHECK (NOT reembolso_pendiente OR estado='APROBADO')
);
-- Dos claves distintas no pueden abrir dos cobros a la vez ni dejar dos pagos vigentes.
CREATE UNIQUE INDEX reservas_pagos_activo ON reservas_pagos (reserva_id) WHERE estado IN ('PROCESANDO','DESCONOCIDO');
CREATE UNIQUE INDEX reservas_pagos_vigente ON reservas_pagos (reserva_id) WHERE estado='APROBADO' AND NOT reembolso_pendiente;
CREATE INDEX reservas_pagos_por_conciliar ON reservas_pagos (creado_en) WHERE estado IN ('PROCESANDO','DESCONOCIDO');
CREATE INDEX reservas_pagos_reserva ON reservas_pagos (reserva_id, creado_en DESC);

CREATE TABLE reservas_eventos_pasarela (
  proveedor text NOT NULL,
  evento_id text NOT NULL,
  recibido_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proveedor, evento_id)
);
