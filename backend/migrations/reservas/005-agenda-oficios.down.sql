-- La agenda confirmada y sus eventos son compromisos auditados.
-- No convertirlos a pendientes ni eliminar bloqueos para revertir código.
DO $$ BEGIN
  RAISE EXCEPTION 'Reversión automática de agenda no disponible; conservar compromisos y aplicar una migración hacia delante';
END $$;
