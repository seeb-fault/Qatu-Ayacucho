# Modelo de datos — Mapas y ubicación

Migración `backend/migrations/catalogo/002-ubicaciones.sql` (con su `.down`).

## `catalogo_ubicaciones`

| Columna | Tipo | Regla |
|---|---|---|
| publicacion_id | uuid PK, FK a `catalogo_publicaciones` | una ubicación por oferta |
| lat, lng | numeric(8,6), numeric(9,6) | punto exacto, dentro de la zona de servicio |
| precision | text | `exacta` o `aproximada` |
| lat_publica, lng_publica | numeric | punto que ve el público |
| actualizado_en | timestamptz | |

Restricciones: zona de servicio en ambos puntos; `exacta` exige punto público igual al exacto; `aproximada` exige que sean distintos.

El punto público se añade a las respuestas públicas de Catálogo como `ubicacion: { lat, lng, precision }` o `null`. El exacto no forma parte de esas respuestas.
