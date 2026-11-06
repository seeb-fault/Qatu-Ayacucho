-- Los intentos y estados de pago son registros auditados.
-- No borrarlos para revertir código; corregir con una migración hacia delante.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de pagos en línea no disponible; conservar los registros y aplicar una migración hacia delante';
END $$;
