# Contrato — Almacenamiento y borde con Cloudflare

La etapa 1 no cambia la API HTTP de Qatu: las rutas de documentos (003) y evidencias (006.2) responden igual. Cambia dónde se guardan los bytes cifrados.

## Configuración (`backend/.env`)

| Variable | Valor |
|---|---|
| `QATU_ALMACEN` | vacío o `postgres` (por defecto), `r2`, o `memoria` (solo pruebas) |
| `QATU_R2_ENDPOINT` | `https://<id de cuenta>.r2.cloudflarestorage.com` |
| `QATU_R2_ACCESS_KEY_ID`, `QATU_R2_SECRET_ACCESS_KEY` | token de cuenta con «Object Read & Write» solo sobre los buckets de Qatu |
| `QATU_R2_BUCKET_PRIVADO` | `qatu-privado-<entorno>` |
| `QATU_R2_BUCKET_PUBLICO` | `qatu-publico-<entorno>` (etapa 2) |

## Operaciones con R2 (S3, firma AWS SigV4, región `auto`)

| Operación | Petición | Respuestas esperadas |
|---|---|---|
| Guardar | `PUT /<bucket>/<clave>` | 200; cualquier otra es error |
| Leer | `GET /<bucket>/<clave>` | 200 con los bytes; 404 si no existe |
| Borrar | `DELETE /<bucket>/<clave>` | 204, 200 o 404 (idempotente) |

## Scripts

- `npm run archivos:mover -- --simular`: cuenta los archivos que siguen en PostgreSQL.
- `npm run archivos:mover`: los mueve, verificando cada uno.
- `npm run restauracion:verificar`: con `QATU_ALMACEN=r2`, también lee y descifra los archivos de R2.
