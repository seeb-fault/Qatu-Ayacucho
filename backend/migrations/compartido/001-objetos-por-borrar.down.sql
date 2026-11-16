DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM objetos_por_borrar) THEN RAISE EXCEPTION 'Hay objetos pendientes de borrar en el almacén: vacía la cola antes de revertir.'; END IF;
END $$;
DROP TABLE objetos_por_borrar;
