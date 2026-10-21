# Decisiones e investigación — Catálogo y publicaciones

## Evidencia local

ADR-002, ADR-003, ADR-005, ADR-008 gobiernan esta entrega. HU01, HU02 y RF01, RF02, RF03, RF15 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Proveedor activo/verificado para publicar; validar propietario también al editar.
- Cada unidad física tiene recursoId estable; el servicio referencia una agenda. Catálogo describe y Reservas bloquea.
- Tipo herramienta/servicio y categoría compatibles; importes enteros en céntimos PEN y unidad explícita.
- Solo publicaciones activas se descubren públicamente; cambios no reescriben snapshots previos de reserva.

## Decisiones pendientes

- D04: búsqueda textual y contrato de filtros/orden/paginación; propuesta en contratos de esta entrega, revisar antes de congelar API.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
