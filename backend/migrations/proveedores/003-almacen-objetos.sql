-- 013: el contenido cifrado puede estar en PostgreSQL (contenido) o en el almacén externo (objeto = clave en R2),
-- nunca en ambos ni en ninguno mientras el archivo esté vigente. El IV y la etiqueta siempre quedan aquí.
ALTER TABLE documentos_proveedor ADD COLUMN objeto text CHECK (objeto IS NULL OR objeto ~ '^[a-z0-9-]+/[a-z0-9-]+/[0-9a-f-]{36}$');
CREATE UNIQUE INDEX documentos_proveedor_objeto ON documentos_proveedor (objeto) WHERE objeto IS NOT NULL;
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'documentos_proveedor'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%eliminado_en IS NULL%' LOOP
    EXECUTE format('ALTER TABLE documentos_proveedor DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE documentos_proveedor ADD CONSTRAINT documentos_contenido_u_objeto CHECK (
  (eliminado_en IS NULL AND iv IS NOT NULL AND tag IS NOT NULL AND octet_length(iv)=12 AND octet_length(tag)=16 AND ((contenido IS NOT NULL) <> (objeto IS NOT NULL)))
  OR (eliminado_en IS NOT NULL AND contenido IS NULL AND objeto IS NULL AND iv IS NULL AND tag IS NULL));
