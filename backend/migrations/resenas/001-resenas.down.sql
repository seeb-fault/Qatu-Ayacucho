-- Las reseñas y su moderación son registros auditados: conservarlos y corregir con una migración hacia delante.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de reseñas no disponible; conservar los registros y aplicar una migración hacia delante';
END $$;
