-- Incidencias y garantías son registros auditados: conservarlos y corregir con una migración hacia delante.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de incidencias y garantías no disponible; conservar los registros y aplicar una migración hacia delante';
END $$;
