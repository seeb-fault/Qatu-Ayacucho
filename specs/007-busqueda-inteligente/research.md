# Decisiones e investigación — Búsqueda inteligente

## Evidencia local

ADR-002, ADR-003, ADR-009 gobiernan esta entrega. HU01, HU15, HU16 y RF01, RF16, RF17 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Salida del modelo es no confiable; validar esquema, límites e IDs contra catálogo y zonas reales.
- Filtros manuales tienen prioridad; fechas relativas con reloj inyectado/contexto America/Lima; ambigüedad se muestra, no se inventa.
- Modelo interpreta, backend consulta precio/disponibilidad. Sin SQL generado ni acciones de escritura.
- Interpretación máximo 3 s y solicitud total 5 s como metas; cortar llamadas al vencer deadline.

## Decisiones pendientes

- D10: proveedor/modelo, presupuesto mensual, cuota por actor y anonimato de métricas; pendiente antes de activar llamadas facturables.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
