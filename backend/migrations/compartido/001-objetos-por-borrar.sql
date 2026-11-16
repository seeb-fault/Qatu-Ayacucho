-- 013: cola de objetos del almacén externo (R2) que deben borrarse. Se escribe en la misma transacción que retira el
-- archivo en PostgreSQL; un proceso la vacía y reintenta si el almacén falla, para que ningún archivo quede olvidado.
CREATE TABLE objetos_por_borrar (
  objeto text PRIMARY KEY CHECK (objeto ~ '^[a-z0-9-]+/[a-z0-9-]+/[0-9a-f-]{36}$'),
  desde timestamptz NOT NULL DEFAULT now(),
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  ultimo_error text
);
