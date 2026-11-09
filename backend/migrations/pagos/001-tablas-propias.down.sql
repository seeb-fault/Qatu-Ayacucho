-- Solo devuelve los nombres anteriores; los registros de pago se conservan.
ALTER TABLE pagos_intentos RENAME TO reservas_pagos;
ALTER TABLE pagos_eventos_pasarela RENAME TO reservas_eventos_pasarela;

DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT conrelid::regclass::text AS tabla, conname AS nombre FROM pg_constraint
    WHERE conrelid IN ('reservas_pagos'::regclass,'reservas_eventos_pasarela'::regclass) AND (conname LIKE 'pagos_intentos%' OR conname LIKE 'pagos_eventos_pasarela%') LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', f.tabla, f.nombre, replace(replace(f.nombre,'pagos_intentos','reservas_pagos'),'pagos_eventos_pasarela','reservas_eventos_pasarela'));
  END LOOP;
  FOR f IN SELECT indexname AS nombre FROM pg_indexes
    WHERE tablename IN ('reservas_pagos','reservas_eventos_pasarela') AND (indexname LIKE 'pagos_intentos%' OR indexname LIKE 'pagos_eventos_pasarela%') LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I', f.nombre, replace(replace(f.nombre,'pagos_intentos','reservas_pagos'),'pagos_eventos_pasarela','reservas_eventos_pasarela'));
  END LOOP;
END $$;
