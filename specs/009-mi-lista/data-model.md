# Modelo de datos — Mi lista

## `reservas_lista_items` (módulo Reservas)

| Columna | Tipo | Regla |
|---|---|---|
| id | uuid PK | generado por el backend |
| cliente_id | uuid NOT NULL | dueño, derivado de la sesión |
| publicacion_id | uuid NOT NULL | publicación activa al guardar |
| recurso_id | uuid NOT NULL | unidad de la herramienta o agenda del oficio |
| tipo | text NOT NULL | `herramienta` o `servicio` |
| inicio | timestamptz NOT NULL | futuro al guardar |
| fin | timestamptz NOT NULL | posterior a `inicio` |
| descripcion | text NOT NULL DEFAULT '' | hasta 1500 caracteres; al menos 20 si `servicio` |
| tarifa_vista_centimos | bigint NULL | tarifa mostrada al guardar; nula si el oficio se cotiza |
| creado_en | timestamptz NOT NULL DEFAULT now() | |

Restricciones:

- `CHECK (tipo <> 'servicio' OR char_length(descripcion) >= 20)`.
- `CHECK (fin > inicio)`.
- Índice único `(cliente_id, publicacion_id, recurso_id, inicio, fin)` contra duplicados exactos.
- Índice `(cliente_id, creado_en)` para listar.
- El límite de 20 ítems se comprueba en la transacción con bloqueo por cliente (`pg_advisory_xact_lock`).

Sin llaves foráneas a Catálogo (otro módulo): la existencia y el estado de la publicación se validan por la fachada pública de Catálogo al guardar y al consultar.

## `reservas_lista_envios`

`(cliente_id, clave)` como llave, `huella` del pedido y `resultados` en JSON. Repetir la clave devuelve los mismos resultados; la misma clave con otro pedido responde 409.

## Envío

Por cada ítem: sacarlo de la lista (`DELETE … RETURNING`), crear la solicitud con el caso de uso de 005 y, si se rechaza, devolverlo a la lista con el motivo.

Migración: `backend/migrations/reservas/011-lista.sql` (con su `.down`).
