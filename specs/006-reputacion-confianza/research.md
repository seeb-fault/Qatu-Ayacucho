# Decisiones e investigación — Reputación y confianza

## Evidencia local

ADR-002, ADR-007, ADR-012 gobiernan esta entrega. HU10, HU14, HU17, HU18 y RF11, RF15, RF18, RF19, RF20 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Nombre técnico resenas; no crear séptimo módulo para confianza.
- Reseña de cliente participante con reserva FINALIZADA; única por cliente/reserva y puntuación 1–5.
- Archivos privados con etapa, autor, hash, fecha y tamaño; referencia a reserva válida y permisos en descarga.
- Garantía documental separada del cobro; estado no acredita custodia ni transferencia bancaria.

## Decisiones pendientes

- D09: límites de archivo, retención/borrado, política de garantía y responsables de revisión antes de habilitar cargas/garantías.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
