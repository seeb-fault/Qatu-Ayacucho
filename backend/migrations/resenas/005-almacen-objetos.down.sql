DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM evidencias WHERE objeto IS NOT NULL) THEN RAISE EXCEPTION 'Hay archivos de evidencias en el almacén externo: devuélvelos a PostgreSQL antes de revertir.'; END IF;
END $$;
ALTER TABLE evidencias DROP CONSTRAINT evidencias_contenido_u_objeto;
DROP INDEX evidencias_objeto;
ALTER TABLE evidencias DROP COLUMN objeto;
ALTER TABLE evidencias ADD CHECK ((eliminada_en IS NULL AND contenido IS NOT NULL AND octet_length(iv)=12 AND octet_length(tag)=16)
  OR (eliminada_en IS NOT NULL AND contenido IS NULL AND iv IS NULL AND tag IS NULL));
