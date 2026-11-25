# Plan — Comportamiento de la base de datos y estrategia de caché

- **Análisis:** `backend/scripts/analizar-base.ts` usa un *pool espía* que ejecuta cada consulta de los repositorios reales con `EXPLAIN (ANALYZE, BUFFERS)` y devuelve el resultado al repositorio; mide 5 repeticiones en caliente y guarda planes, tamaños de tablas, uso de índices y configuración de PostgreSQL.
- **Optimización:** `PostgresReservas.listar` deja de materializar todas las reservas de la cuenta: el total sale del índice y las columnas completas se arman solo para la página.
- **Caché (patrón Decorator, principio abierto/cerrado):**
  - `src/shared/infraestructura/cache.ts`: `CacheMemoria` (TTL, LRU, lectura compartida, errores sin guardar) y `segundosDeCache`.
  - `src/modules/catalogo/infraestructura/cache.ts`: `RepositorioCatalogoEnCache` (solo búsqueda pública; escrituras invalidan) y `ProveedoresCatalogoEnCache`.
  - `catalogo.module.ts`: el `Catalogo` de las rutas HTTP usa los decoradores; `ConsultaCatalogo` (para Reservas) usa el repositorio sin caché.
- **HTTP:** `@Header('Cache-Control', …)` en lecturas públicas; el filtro global de errores fuerza `no-store`.
- **Medición:** `.github/workflows/carga.yml` corre el perfil de 2 000 usuarios con `QATU_CACHE_SEGUNDOS=0` y `=30` en máquinas separadas.
