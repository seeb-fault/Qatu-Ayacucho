# 008 — Despliegue y validación del MVP

**Estado:** diseño operativo; ningún VPS publicado ni ensayo ejecutado. Entrega transversal de los seis módulos, sin módulo nuevo.

## Objetivo

Ejecutar Qatu en un VPS Linux con HTTPS, persistencia, observabilidad y capacidad de restauración. RC15/RC16/RC19; ADR-010/ADR-012; EQ-01/EQ-03/EQ-09 y regresión EQ-04/EQ-07/EQ-08.

## User Scenarios & Testing

### US1 — Publicar una versión (P1)

Como responsable quiero desplegar imágenes por commit. Dadas imágenes verificadas y migraciones compatibles, al publicar, web/API quedan listas, PostgreSQL permanece privado y un smoke test recorre búsqueda y reserva/pago sandbox.

### US2 — Recuperar datos (P1)

Como responsable quiero restaurar un host perdido. Dada una copia externa cifrada, al restaurar en entorno vacío, las referencias de BD/archivos se conservan y se concilian pagos posteriores al backup; RPO ≤24 h/RTO ≤4 h son metas por medir.

### US3 — Detectar fallos (P1)

Como responsable quiero observar latencia, errores y pagos desconocidos. Ante caída de IA, readiness de operaciones principales no se declara caída si BD/API siguen operativas; se emiten señales de fallo del tercero y backup sin exponer secretos.

## Functional Requirements

- OPS-FR01: proxy HTTPS, red privada web/API/BD, volúmenes y secretos fuera de Git.
- OPS-FR02: imágenes por commit y procedimiento de migración/rollback compatible.
- OPS-FR03: copias externas cifradas de BD y archivos con verificación de restore.
- OPS-FR04: logs estructurados, correlationId, liveness/readiness y alertas operativas.
- OPS-FR05: registrar costo/CPU/RAM/disco y resultados EQ bajo carga documentada.

## Edge Cases

Disco lleno, backup incompleto, archivo perdido, restauración de BD sin evidencia, proceso caído, host perdido y evento de pago posterior a la copia. Redis opcional no sustituye estado autoritativo.

## Success Criteria

Una versión verificable y un restore real con mediciones; invariantes EQ-04/07/08 sin regresiones; medidas EQ-01/03/09 reportadas con condiciones y desviaciones. Un solo VPS sigue siendo punto único de fallo.

## Pendientes y dependencias

Elegir dominio, proveedor VPS, presupuesto, destino/retención de copias y canal de alertas antes de publicar. No hace falta adquirir VPS para preparar los artefactos. Depende de entregas 001–007 para aceptación completa, aunque Compose/CI se pueden preparar al inicio.

[Despliegue fuente](../../docs/04-modelo-c4/despliegue-vps.md) · [Plan](./plan.md) · [Tareas](./tasks.md).
