# Modelo de datos — Información legal y Libro de Reclamaciones

Migración `backend/migrations/resenas/004-libro-reclamaciones.sql` (con su `.down`).

## `reclamaciones_correlativo`

| Columna | Tipo | Regla |
|---|---|---|
| anio | integer PK | año en hora de Lima |
| ultimo | integer | último número asignado; se incrementa en la misma transacción que inserta la hoja |

## `reclamaciones_hojas`

| Columna | Tipo | Regla |
|---|---|---|
| id | uuid PK | |
| numero | text único | `LR-AAAA-NNNNNN` |
| codigo_consulta_hash | text | SHA-256 del código entregado en la constancia (64 caracteres) |
| tipo | text | `reclamo` o `queja` |
| titular | jsonb | razón social, RUC, dirección, correo y teléfono de Qatu al presentarla |
| usuario_id | uuid nulo | cuenta, si había sesión |
| nombre, tipo_documento, numero_documento, domicilio, telefono, email | text | consumidor; `DNI`, `CE`, `PASAPORTE` o `RUC`; celular `9XXXXXXXX` opcional |
| medio_respuesta | text | `correo` o `carta` |
| menor_de_edad, apoderado_nombre, apoderado_documento | | los datos del apoderado existen solo si es menor |
| bien_tipo, bien_descripcion, monto_centimos | | `producto` o `servicio`; monto opcional |
| detalle, pedido | text | 20–2000 y 10–1000 caracteres |
| presentada_en | timestamptz | |
| vence_en | date | 15 días hábiles |
| respuesta, respuesta_medio, respondida_en, respondida_por | | todos nulos o todos presentes |

Índices: pendientes por `vence_en` y presentadas por fecha. Ninguna ruta edita ni borra hojas.
