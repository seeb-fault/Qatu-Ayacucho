BEGIN;
-- Revertir solo si no existen propuestas; nunca descartar acuerdos para volver atrás.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM reservas_cotizaciones) THEN RAISE EXCEPTION 'Existen cotizaciones; conservar acuerdos y usar migración hacia delante'; END IF;
END $$;
DROP TABLE reservas_cotizaciones;
DROP FUNCTION conservar_cotizacion_reserva();
ALTER TABLE reservas_outbox DROP CONSTRAINT reservas_outbox_tipo_check;
ALTER TABLE reservas_outbox ADD CONSTRAINT reservas_outbox_tipo_check CHECK (tipo IN
  ('SOLICITUD_CREADA','SOLICITUD_RECHAZADA','SOLICITUD_ACEPTADA','VISITA_ACORDADA','APARTADO_AMPLIADO','RESERVA_CANCELADA',
   'EFECTIVO_REGISTRADO','RECEPCION_CONFIRMADA','DEVOLUCION_INFORMADA','DEVOLUCION_CONFIRMADA','DEVOLUCION_RECHAZADA','RESERVA_VENCIDA'));
DELETE FROM migraciones WHERE nombre='reservas/004-cotizaciones';
COMMIT;
