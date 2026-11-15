# Contrato HTTP — Mi lista

Todas las rutas exigen sesión (401 sin ella) y operan solo sobre la lista del actor.

| Método | Ruta | Cuerpo / respuesta | Errores |
|---|---|---|---|
| GET | /lista | `{ items: ItemLista[], total }`, agrupables por `proveedor` | 401 |
| GET | /lista/resumen | `{ total }` para el contador del encabezado | 401 |
| POST | /lista/items | `{ publicacionId, recursoId, inicio, fin, descripcionTrabajo? }` (obligatoria en oficios, 20–1500) → 201 `ItemLista` con `total` | 400 datos inválidos; 403 publicación propia; 404 publicación inactiva; 409 `ITEM_DUPLICADO`, `LISTA_LLENA` |
| DELETE | /lista/items/:id | Cuerpo `{}` → 204 | 404 si no existe o es de otro |
| POST | /lista/items/:id/tarifa | Cuerpo `{}`; acepta la tarifa vigente → 200 `ItemLista` | 404 si no existe o es de otro |
| POST | /lista/envio | Cabecera `Idempotency-Key` (16–64 caracteres); cuerpo `{ ids?: string[], aceptaCondiciones?: boolean }` (todos si se omite `ids`) → 201 `{ resultados: [{ itemId, estado: 'enviado' \| 'rechazado', solicitudId?, motivo? }] }` | 400 sin clave; 409 si la misma clave llega con otro cuerpo |

`ItemLista`: `{ id, publicacionId, titulo, tipo, proveedor, recurso?, inicio, fin, descripcion?, tarifaVistaCentimos, tarifaActualCentimos, estado: 'listo' | 'tarifa_cambiada' | 'fechas_vencidas' | 'no_disponible' | 'inactiva' }`.

## Regreso tras el ingreso

`/ingresar?siguiente=<ruta>` y `/registro?siguiente=<ruta>`: tras el éxito se navega a `siguiente` solo si es una ruta interna válida (empieza con `/`, no con `//` ni `/\`, sin esquema). Si no, se usa el destino por tipo de cuenta (panel del proveedor, cuenta del administrador, inicio del cliente).

Sin llamadas externas. Los nombres de campo siguen las convenciones de los contratos de 005.
