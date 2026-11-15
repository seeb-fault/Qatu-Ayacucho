-- Las evidencias pueden sostener una incidencia: conservarlas y corregir con una migración hacia delante.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de evidencias no disponible; conservar los registros y aplicar una migración hacia delante';
END $$;
