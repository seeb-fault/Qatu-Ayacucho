Datos: 1000 publicaciones, 100 proveedores, 5000 reservas, 105 usuarios. PostgreSQL 17.5 (Debian 17.5-1.pgdg110+1).

| Consulta | Media (ms) | Máximo (ms) | Operaciones del plan | Índices usados | Bloques caché / disco |
|---|---|---|---|---|---|
| Búsqueda pública sin filtros (página 1) | 4.65 | 5.64 | Hash Join, Seq Scan, Aggregate, Sort, Subquery Scan, Limit, WindowAgg, CTE Scan, Index Scan | catalogo_publicaciones_pkey, catalogo_recurso_oferta_idx | 195 / 0 |
| Búsqueda por texto «taladro» | 2.98 | 3.28 | Hash Join, Seq Scan, Bitmap Heap Scan, Bitmap Index Scan, Aggregate, Sort, Subquery Scan, Limit, WindowAgg, CTE Scan, Index Scan | catalogo_busqueda_idx, catalogo_publicaciones_pkey, catalogo_recurso_oferta_idx | 189 / 0 |
| Búsqueda por tipo, categoría y distrito, orden por precio | 3.06 | 4.09 | Hash Join, Seq Scan, Bitmap Heap Scan, Bitmap Index Scan, Aggregate, Sort, Subquery Scan, Limit, WindowAgg, CTE Scan, Index Scan | catalogo_filtros_idx, catalogo_publicaciones_pkey, catalogo_recurso_oferta_idx | 167 / 0 |
| Búsqueda con presupuesto máximo, página 3 | 3.53 | 4.12 | Hash Join, Seq Scan, Aggregate, Sort, Subquery Scan, Limit, WindowAgg, CTE Scan, Index Scan | catalogo_publicaciones_pkey, catalogo_recurso_oferta_idx | 195 / 0 |
| Detalle de una publicación | 0.4 | 0.49 | Index Scan, Seq Scan, Aggregate | catalogo_publicaciones_pkey, catalogo_tarifas_pkey, catalogo_recurso_oferta_idx | 9 / 0 |
| Proveedores habilitados (perfiles publicables) | 0.65 | 0.8 | Seq Scan | — | 103 / 0 |
| Proveedores habilitados (cuentas activas) | 0.18 | 0.21 | Seq Scan | — | 5 / 0 |
| Mis reservas (cliente con más reservas, página 1) | 1.71 | 1.94 | Aggregate, Index Only Scan, Subquery Scan, Limit, Index Scan, Sort, Seq Scan | reservas_cliente | 36 / 0 |
| Disponibilidad de una unidad en un mes | 0.36 | 0.42 | Sort, Seq Scan, Index Only Scan | reservas_posesion_unica | 2 / 0 |
