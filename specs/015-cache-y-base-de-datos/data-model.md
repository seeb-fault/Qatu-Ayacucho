# Modelo de datos — Comportamiento de la base de datos y estrategia de caché

Sin migraciones. La optimización de «Mis reservas» usa los índices existentes `reservas_cliente` y `reservas_propietario` (`(cuenta, creado_en DESC, id DESC)`).

## Caché (memoria del proceso)

| Caché | Clave | Valor | TTL | Máximo | Se vacía al |
|---|---|---|---|---|---|
| Búsqueda pública | filtros normalizados + hash del conjunto de proveedores habilitados | `{ items, total }` | `QATU_CACHE_SEGUNDOS` | 500 (LRU) | crear, editar, moderar, ubicar o quitar ubicación |
| Proveedores habilitados | `habilitados` | lista de `{ id, nombrePublico, estadoVerificacion }` | `QATU_CACHE_SEGUNDOS` | 1 | las mismas escrituras |

## Variables de entorno

| Variable | Valores | Efecto |
|---|---|---|
| `QATU_CACHE_SEGUNDOS` | 0–300 | Vacío: 30 (0 con `NODE_ENV=test`). 0 apaga la caché |
