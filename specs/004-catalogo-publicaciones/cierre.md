# Cierre funcional local — Catálogo y publicaciones 004

Fecha: 2026-10-26. Código validado: `73ba16b3c0af04acc8e9704afc759e9d2fe613f5`. El décimo commit incorpora estas evidencias y la documentación de cierre; no cambia el código medido.

## Resultado

Publicar, editar y desactivar ofertas, conservar recursos estables, buscar/listar/detallar ofertas públicas y moderarlas con motivo e historial están implementados y probados con persistencia real. Se mantienen cuenta activa, aprobación documental, consentimiento público y propiedad como condiciones de publicación; no se saltan para facilitar el recorrido.

El CI del código aprobó 51 pruebas backend/PostgreSQL (sin omisiones), 28 E2E y 8 del detector. [Ejecución del código validado](https://github.com/seeb-fault/Qatu-Ayacucho/actions/runs/40279853296). El CI del décimo commit debe aprobar también antes del merge.

## Carga local completa

Cinco minutos de calentamiento (26272 peticiones excluidas de las medidas), seguidos de tres escalones de cinco minutos. Corpus aislado: 100 proveedores, 1000 publicaciones, 1500 recursos y 800 ofertas públicas, 80 por categoría. Tráfico 70% búsqueda y 30% detalle por el proxy Next.js real; 250 ms de espera por usuario entre peticiones.

| Usuarios | Peticiones medidas | req/s | p50 ms | p95 ms | p99 ms | Errores técnicos/contrato |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 10521 | 35.07 | 26 | 51 | 79 | 0 / 0 |
| 30 | 29068 | 96.84 | 47 | 122 | 177 | 0 / 0 |
| 60 | 35768 | 119.14 | 244 | 388 | 464 | 0 / 0 |

Total medido: 75357 peticiones. Objetivos locales derivados: p95 ≤ 1 s a 10/30 usuarios, ≤ 2 s a 60, errores técnicos < 1% y cero fallos de contrato. Todos se cumplen. El código conservó el mismo SHA-256 durante el ensayo; no hubo modificaciones de aplicación ni sustitución de datos por demo.

- [Informe legible](evidencias/carga-local.md).
- [JSON completo con muestras y huella](evidencias/carga-local.json).
- [Disco, Docker y recursos compartidos del equipo](evidencias/entorno-host.json).
- [Protocolo reproducible](protocolo-carga.md).

El host estaba compartido con otros proyectos; el generador, Next.js, API y PostgreSQL compartían recursos. Estos números no son capacidad acreditada de un VPS ni una promesa comercial.

## Optimización comprobada

El listado construía recursos para las 800 filas públicas antes de limitar a 20. Ahora filtra/cuenta columnas ligeras y agrega recursos solo para la página; mantiene una sola instantánea SQL y orden estable.

Los planes conservados muestran 800 evaluaciones de recursos antes y 20 después. Las muestras de EXPLAIN registraron 37.064 ms y 3.36 ms respectivamente; son muestras individuales, no percentiles ni una atribución causal completa de cambios entre ensayos. Los diagnósticos cortos se conservan como diagnóstico, no como aceptación de carga.

[Plan inicial](evidencias/plan-inicial.json) · [Plan optimizado](evidencias/plan-optimizado.json) · [Diagnóstico inicial](evidencias/diagnostico-inicial.json) · [Diagnóstico optimizado](evidencias/diagnostico-optimizado.json).

## Alcance del cierre y seguimiento

- T023: permisos, filtros persistidos y carga **local de Catálogo** verificados; cierre local.
- T027: permanece pendiente para el escenario **global** EQ-01/EQ-03 con 5000 reservas, mezcla 70/20/10 e infraestructura objetivo. Seguimiento en 005 y 008. No se crean reservas ficticias para declarar el caso aprobado.
- Revisión humana independiente y EQ-06 con cinco participantes: pendientes. Las verificaciones automatizadas de teclado/móvil no sustituyen a personas ni acreditan el objetivo de tiempo de tarea.
- D02, mapas, reservas/pagos y operación de conservación/copias conservan sus pendientes propios. Las ilustraciones son de referencia; no se implementó carga de fotografías de ofertas.

La aceptación funcional y la calidad local de Catálogo están verificadas. La aceptación global del MVP sigue abierta en los puntos indicados.
