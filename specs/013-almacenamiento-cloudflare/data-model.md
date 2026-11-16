# Modelo de datos — Almacenamiento y borde con Cloudflare

## `evidencias` y `documentos_proveedor` (migraciones `resenas/005-almacen-objetos` y `proveedores/003-almacen-objetos`)

| Columna | Cambio | Regla |
|---|---|---|
| objeto | nueva, `text` nulo, índice único parcial | clave en el almacén: `resenas/evidencias/<id>` o `proveedores/documentos/<id>` |
| contenido | sin cambio | bytes cifrados cuando el archivo está en PostgreSQL |
| iv, tag | sin cambio | siempre en PostgreSQL mientras el archivo esté vigente |

Restricciones `evidencias_contenido_u_objeto` y `documentos_contenido_u_objeto`:
- **Vigente:** IV de 12 bytes y etiqueta de 16, y exactamente uno de `contenido` u `objeto`.
- **Retirado:** `contenido`, `objeto`, `iv` y `tag` nulos.

Reemplazan a las restricciones anteriores. El `.down` se niega a revertir si queda algún archivo en el almacén.

## `objetos_por_borrar` (migración `compartido/001-objetos-por-borrar`)

| Columna | Tipo | Regla |
|---|---|---|
| objeto | text PK | clave del objeto a borrar |
| desde | timestamptz | cuándo se encoló |
| intentos | integer ≥ 0 | intentos fallidos |
| ultimo_error | text | último error del almacén, sin datos personales |

## Objetos en R2

Bucket privado: `proveedores/documentos/<id>` y `resenas/evidencias/<id>`, con los bytes cifrados (AES-256-GCM; dato autenticado: el id). Sin metadatos ni nombres de archivo originales.
