DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM documentos_proveedor WHERE objeto IS NOT NULL) THEN RAISE EXCEPTION 'Hay archivos de documentos_proveedor en el almacén externo: devuélvelos a PostgreSQL antes de revertir.'; END IF;
END $$;
ALTER TABLE documentos_proveedor DROP CONSTRAINT documentos_contenido_u_objeto;
DROP INDEX documentos_proveedor_objeto;
ALTER TABLE documentos_proveedor DROP COLUMN objeto;
ALTER TABLE documentos_proveedor ADD CHECK ((eliminado_en IS NULL AND contenido IS NOT NULL AND iv IS NOT NULL AND tag IS NOT NULL AND octet_length(iv)=12 AND octet_length(tag)=16)
  OR (eliminado_en IS NOT NULL AND contenido IS NULL AND iv IS NULL AND tag IS NULL));
