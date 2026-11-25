# Contrato HTTP — Caché

Sin rutas nuevas. Cambian las cabeceras:

| Ruta | Cache-Control |
|---|---|
| GET /publicaciones/opciones, GET /proveedores/zonas | `public, max-age=3600` |
| GET /publicaciones, GET /publicaciones/:id | `public, max-age=30` |
| Todo lo demás y cualquier respuesta de error | `no-store` |

El contenido de las respuestas no cambia.
