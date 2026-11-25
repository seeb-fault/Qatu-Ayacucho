# Carga progresiva hasta 2 000 usuarios virtuales (k6)

Sprint 2, actividad 8: «simular progresivamente hasta 2 000 usuarios virtuales concurrentes». Escenarios **EQ-01** y **EQ-03**, atributos **AC01 Rendimiento** y **AC03 Escalabilidad**. Spec [016](../../../specs/016-pruebas-jest-y-carga/spec.md).

## Qué se probó

- **Recorrido de cada usuario virtual** ([carga.k6.js](../scripts/carga.k6.js), perfil `PERFIL=2000`): 70 % búsquedas con filtros al azar (tipo, categoría, distrito, texto, orden y página), 20 % detalles de publicaciones, 5 % «Mis reservas» con sesión y 5 % consultas de disponibilidad. Entre acción y acción hay una pausa de 0,5 a 1,5 s, el tiempo de lectura de una persona.
- **Escalones progresivos:** 100 → 250 → 500 → 1 000 → 1 500 → **2 000** usuarios. Cada escalón sube en 30 s desde el anterior y se mantiene 90 s, con métricas propias. En total son 12 minutos.
- **Datos:** 100 proveedores aprobados, 1 000 publicaciones, 5 000 reservas y 5 clientes con sesión, en una base `_test` exclusiva.
- **Metas:** p95 ≤ 1 s hasta 500 usuarios (AC01 y AC03) y ≤ 2 s por encima, con menos de 1 % de errores, en cada escalón.
- **Dónde:** [workflow «Carga k6»](../../../.github/workflows/carga.yml) en GitHub Actions. Dos trabajos en paralelo, en máquinas separadas, con la misma versión del código: **sin caché** (`QATU_CACHE_SEGUNDOS=0`) y **con caché de 30 s**. Cada máquina tiene 4 núcleos y 16–17 GB, y corre PostgreSQL 17 con PostGIS, la API (un solo proceso de Node.js 24) y k6 2.4.0 en Docker.
- **Se repitió dos veces** (corrida 1 y corrida 2, 2026-11-25). La corrida 2 corrigió dos detalles del script que no cambian la carga: los permisos de escritura del resumen JSON y una etiqueta `name` por operación, que evita miles de series de métricas.

## Resultados

p95 por escalón (p50 / p95 / p99 completos en cada `k6.txt`):

| Usuarios | Corrida 1 sin caché | Corrida 2 sin caché | Corrida 1 con caché | Corrida 2 con caché | Meta p95 |
|---|---|---|---|---|---|
| 100 | 5 ms | 4 ms | 3 ms | 4 ms | ≤ 1 s |
| 250 | 6 ms | 5 ms | 3 ms | 5 ms | ≤ 1 s |
| 500 | 11 ms | 8 ms | 3 ms | 6 ms | ≤ 1 s |
| 1 000 | 381 ms | 326 ms | 5 ms | 11 ms | ≤ 2 s |
| 1 500 | 1 099 ms | 1 026 ms | 11 ms | 199 ms | ≤ 2 s |
| **2 000** | **1 801 ms** | **1 595 ms** | **168 ms** | **731 ms** | ≤ 2 s |
| Errores (todos los escalones) | 0,00 % | 0,00 % | 0,00 % | 0,00 % | < 1 % |
| Peticiones atendidas | 399 853 (553/s) | 405 868 (561/s) | 606 736 (840/s) | 551 598 (763/s) | — |
| Comprobaciones correctas | 100 % | 100 % | 100 % | 100 % | — |
| Procesador asignado por GitHub | AMD EPYC 9V45 | Intel Xeon 6975P | Intel Xeon 6975P | AMD EPYC 7763 | — |

**Las 12 metas se cumplen en las cuatro ejecuciones** (k6 terminó con código 0 en la corrida 2; en la corrida 1 las métricas son las mismas, pero el JSON de resumen no se guardó en la ejecución sin caché).

### Lectura de los resultados

1. **AC01 y AC03 se cumplen con margen:** hasta 500 usuarios, el p95 no pasa de 11 ms, frente a la meta de 1 s. En el Sprint 1, en la laptop, el p95 con 500 usuarios era de 3,8 s. La diferencia viene de la máquina (k6 ya no compite con Docker Desktop y otros proyectos), de la optimización de la base y de la caché.
2. **Sin caché, la API llega a 2 000 usuarios sin errores, pero cerca del límite:** p95 de 1,6 a 1,8 s. Desde 1 000 usuarios la latencia crece porque cada búsqueda hace 3 consultas, en pools de 5 a 10 conexiones por módulo, y las peticiones esperan una conexión libre (ver el [análisis de la base](../base-de-datos/README.md)). PostgreSQL llega a 1,8–2 núcleos de CPU.
3. **La caché cambia el comportamiento bajo carga.** Con el mismo procesador (Intel Xeon 6975P: corrida 2 sin caché frente a corrida 1 con caché):

   | Con 2 000 usuarios | Sin caché | Con caché | Mejora |
   |---|---|---|---|
   | p95 | 1 595 ms | 168 ms | **9,5 veces menos** |
   | p50 | 1 293 ms | 3 ms | 430 veces menos |
   | Peticiones por segundo (toda la prueba) | 561 | 840 | **+50 %** |

   Con 1 000 usuarios, el p95 baja de 326–381 ms a 5–11 ms.
4. **Variabilidad entre máquinas:** la corrida 2 con caché tocó el procesador más antiguo (AMD EPYC 7763) y dio 731 ms con 2 000 usuarios: sigue cumpliendo la meta y es 2,2 veces mejor que sin caché. Como k6 genera la carga en la misma máquina que la API, compite con ella por la CPU. Estos números son una **cota inferior** de lo que da un servidor dedicado.

### Recursos (muestreo cada 5 s, [recursos.csv](corrida-2/carga-2000-cache-0/recursos.csv))

| Ejecución | Memoria máx. de la API | CPU de PostgreSQL en el último escalón (promedio) |
|---|---|---|
| Corrida 2, sin caché | 516 MB | 160 % (1,6 núcleos) |
| Corrida 2, con caché | 403 MB | 177 % |
| Corrida 1, sin caché | 495 MB | 175 % |
| Corrida 1, con caché | 379 MB | 136 % |

La columna de CPU de la API en `recursos.csv` sale de `ps %cpu`, que es un promedio desde que arrancó el proceso, no el uso instantáneo. Sirve para comparar ejecuciones, no para leer el pico.

## Limitaciones

- La API, PostgreSQL y k6 comparten 4 núcleos. La medición en el servidor de producción depende de la spec 008 (AWS EC2 con Dokploy).
- Un solo proceso de Node.js. Para crecer más allá de 2 000 usuarios: varias réplicas de la API detrás de Traefik (la caché tolera el desfase de hasta 30 s entre réplicas), menos idas a la base por búsqueda y un PgBouncer delante de PostgreSQL.
- Los datos son sintéticos (1 000 publicaciones). Con un catálogo mucho mayor, la búsqueda sin filtros deberá limitar el conteo total.

## Archivos

| Carpeta | Contenido |
|---|---|
| [corrida-2/carga-2000-cache-0/](corrida-2/carga-2000-cache-0/) | Sin caché: `k6.txt` (resumen legible), `resumen-k6.json` (todas las métricas), `recursos.csv`, `entorno.json` |
| [corrida-2/carga-2000-cache-30/](corrida-2/carga-2000-cache-30/) | Con caché de 30 s: los mismos archivos |
| [corrida-1/](corrida-1/) | Primera ejecución (sin el JSON de resumen en la variante sin caché) |

Para repetirla: GitHub → Actions → **Carga k6** → *Run workflow* (o subir una rama `carga/…`). La opción «Corrida corta» deja 20 s por escalón.
