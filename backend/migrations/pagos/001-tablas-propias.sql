-- Pagos pasa a ser un módulo propio y sus tablas dejan de llevar el prefijo de Reservas. Solo cambian
-- nombres: ningún dato se toca. Las columnas de pago de la tabla reservas siguen siendo de Reservas.
ALTER TABLE reservas_pagos RENAME TO pagos_intentos;
ALTER TABLE reservas_eventos_pasarela RENAME TO pagos_eventos_pasarela;

DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT conrelid::regclass::text AS tabla, conname AS nombre FROM pg_constraint
    WHERE conrelid IN ('pagos_intentos'::regclass,'pagos_eventos_pasarela'::regclass) AND (conname LIKE 'reservas_pagos%' OR conname LIKE 'reservas_eventos_pasarela%') LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', f.tabla, f.nombre, replace(replace(f.nombre,'reservas_pagos','pagos_intentos'),'reservas_eventos_pasarela','pagos_eventos_pasarela'));
  END LOOP;
  FOR f IN SELECT indexname AS nombre FROM pg_indexes
    WHERE tablename IN ('pagos_intentos','pagos_eventos_pasarela') AND (indexname LIKE 'reservas_pagos%' OR indexname LIKE 'reservas_eventos_pasarela%') LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I', f.nombre, replace(replace(f.nombre,'reservas_pagos','pagos_intentos'),'reservas_eventos_pasarela','pagos_eventos_pasarela'));
  END LOOP;
END $$;
