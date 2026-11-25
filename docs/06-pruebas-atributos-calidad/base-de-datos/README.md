# Base de datos y estrategia de caché

Sprint 2, actividad 5: «Analizar el comportamiento de la base de datos y la estrategia de caché». Spec [015](../../../specs/015-cache-y-base-de-datos/spec.md).

## 1. Cómo se midió

[backend/scripts/analizar-base.ts](../../../backend/scripts/analizar-base.ts) (`npm run base:analizar`) ejecuta las **consultas reales de los repositorios**, con el mismo SQL y los mismos parámetros que la API, a través de un *pool espía*. El pool corre cada consulta con `EXPLAIN (ANALYZE, BUFFERS)` y le devuelve al repositorio el resultado real. Cada consulta se calienta una vez y se mide 5 veces.

- **Datos:** base `_test` con los datos de carga ([datos-carga.ts](../../../backend/test/carga/datos-carga.ts)): 100 proveedores aprobados, 1 000 publicaciones en todas las categorías y distritos, 5 000 reservas y 105 cuentas.
- **Motor:** PostgreSQL 17.5 en Docker, configuración por defecto (`shared_buffers` 128 MB, `work_mem` 4 MB, `max_connections` 100).
- **Resultados completos:** [planes.json](planes.json) (planes, tamaños de tablas, uso de índices) y [mediciones.md](mediciones.md).

## 2. Resultados

| Consulta | Media | Máximo | Índices usados | Bloques leídos |
|---|---|---|---|---|
| Búsqueda pública sin filtros (página 1) | 4,65 ms | 5,64 ms | `catalogo_publicaciones_pkey`, `catalogo_recurso_oferta_idx` | 195 |
| Búsqueda por texto «taladro» | 2,98 ms | 3,28 ms | `catalogo_busqueda_idx` (texto completo) | 189 |
| Búsqueda por tipo, categoría y distrito, orden por precio | 3,06 ms | 4,09 ms | `catalogo_filtros_idx` | 167 |
| Búsqueda con presupuesto máximo, página 3 | 3,53 ms | 4,12 ms | `catalogo_publicaciones_pkey` | 195 |
| Detalle de una publicación | 0,40 ms | 0,49 ms | claves primarias | 9 |
| Proveedores habilitados: perfiles publicables | 0,65 ms | 0,80 ms | — (100 filas) | 103 |
| Proveedores habilitados: cuentas activas | 0,18 ms | 0,21 ms | — | 5 |
| **Mis reservas** (cliente con 1 000 reservas) | **1,71 ms** | 1,94 ms | `reservas_cliente` | **36** |
| Disponibilidad de una unidad en un mes | 0,36 ms | 0,42 ms | `reservas_posesion_unica` | 2 |

Todas las lecturas salen de la caché de PostgreSQL: 0 bloques leídos de disco.

### Lo que encontró el análisis

1. **Las búsquedas usan sus índices.** El texto usa el índice de texto completo en español sin tildes (`catalogo_busqueda_idx`) y los filtros, el índice compuesto (`catalogo_filtros_idx`). Sin filtros, PostgreSQL recorre las 1 000 publicaciones (Seq Scan) porque necesita contarlas todas para el total. Con este volumen es lo correcto: cuesta menos de 2 ms.
2. **«Mis reservas» era la consulta más cara, y se corrigió.** Un CTE `MATERIALIZED` armaba **todas** las reservas de la cuenta, con la subconsulta de cotizaciones de cada una, solo para contarlas y quedarse con 20. Ahora el total sale solo del índice (`Index Only Scan`) y las columnas completas se arman únicamente para las 20 filas de la página, que el índice `(cliente_id, creado_en DESC, id DESC)` entrega ya ordenadas. Se midió con la misma base y en las mismas condiciones:

   | Versión | Media | Máximo | Bloques | Resultado |
   |---|---|---|---|---|
   | Antes (CTE materializado) | 7,59 ms | 7,88 ms | 172 | 1 000 en total; misma primera fila |
   | Después (índice + página) | **1,49 ms** | 1,60 ms | **36** | 1 000 en total; misma primera fila |

   Es **5 veces más rápida** y lee **4,8 veces menos bloques**, y la diferencia crece con el historial de cada cuenta.
3. **Los recorridos completos que quedan son de tablas chicas o vacías** (tarifas, ubicaciones, cotizaciones, proveedores). Ahí un índice no ayuda y PostgreSQL elige bien no usarlo.
4. **El límite bajo carga no está en las consultas, sino en las idas a la base.** Cada búsqueda pública hace **3 consultas** (perfiles publicables, cuentas activas y la página del catálogo), cada una en el pool de su módulo. Un proceso de la API abre hasta **38 conexiones**: 5 por módulo, 10 en Usuarios, 2 en el almacén y 1 en Salud. Una conexión se espera como máximo 5 s. Con cientos de usuarios simultáneos, las peticiones hacen cola por una conexión aunque cada consulta tarde 3 ms. Esto explica el p95 de 3,8 s con 500 usuarios del Sprint 1. Subir los pools no es la salida: con 6 módulos y varias réplicas se supera `max_connections` (100).

## 3. Estrategia de caché

La caché ataca el punto 4: que la búsqueda pública, el 70 % del tráfico, no vaya a la base en cada petición.

| Capa | Qué guarda | Duración | Invalidación |
|---|---|---|---|
| **PostgreSQL** (shared buffers) | Páginas de tablas e índices | Mientras haya memoria | Automática |
| **Aplicación** (`CacheMemoria`, en memoria del proceso) | Página de resultados de la búsqueda pública (clave: filtros + proveedores habilitados) y lista de proveedores habilitados | `QATU_CACHE_SEGUNDOS` (30 s por defecto) | Cualquier escritura del catálogo (crear, editar, moderar, ubicar) la vacía al instante |
| **HTTP** (`Cache-Control`) | Respuestas públicas en el navegador o en una CDN | 1 h (categorías y distritos), 30 s (búsqueda y detalle) | Vencimiento |

**Diseño (patrón Decorator, principio abierto/cerrado):** [`RepositorioCatalogoEnCache`](../../../backend/src/modules/catalogo/infraestructura/cache.ts) y `ProveedoresCatalogoEnCache` envuelven al repositorio de PostgreSQL y a la fachada de Proveedores, sin cambiar el dominio ni los casos de uso. [`CacheMemoria`](../../../backend/src/shared/infraestructura/cache.ts) guarda como máximo 500 entradas y desaloja la usada hace más tiempo (LRU). Si llegan varias peticiones iguales a la vez, consultan la base una sola vez. Un error nunca se guarda. Cambiar a Redis más adelante sería otro decorador.

**Qué nunca pasa por la caché:** nada con sesión (mis publicaciones, reservas, administración), el detalle que valida Reservas antes de aceptar una solicitud, ni ninguna respuesta de error. Toda respuesta de error sale con `Cache-Control: no-store`. Esto último lo detectó la colección Bruno: `@Header` se aplica antes del controlador y un 400 de la búsqueda salía como cacheable.

**Desactualización máxima (aceptada y documentada):** un cambio del propio catálogo se ve al instante en esa réplica. Un cambio de otro módulo (verificación, visibilidad o cuenta inactiva de un proveedor) o de otra réplica se ve a más tardar en `QATU_CACHE_SEGUNDOS`.

**Pruebas:** [test/catalogo/cache.test.ts](../../../backend/test/catalogo/cache.test.ts) cubre:

- vencimiento, LRU, lectura compartida entre peticiones simultáneas y errores que no se guardan;
- que la vista del dueño y del administrador no se guarde en caché;
- que las escrituras invaliden la caché aunque fallen;
- las cabeceras HTTP sobre la API real, incluidos los 400, 401 y 404 con `no-store`.

## 4. Efecto medido con k6

Mismo perfil de 2 000 usuarios virtuales (ver [carga-2000](../carga-2000/README.md)) en dos máquinas iguales de GitHub Actions, sin caché (`QATU_CACHE_SEGUNDOS=0`) y con caché de 30 s. Los resultados están en [carga-2000/README.md](../carga-2000/README.md).
