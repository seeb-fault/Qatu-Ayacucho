-- Inicio, término, cierre y efectivo de oficios son declaraciones auditadas.
-- No borrarlos para revertir código; corregir con una migración hacia delante.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de ejecución de oficios no disponible; conservar declaraciones y aplicar una migración hacia delante';
END $$;
