# Trazabilidad docs → specs

Estado: cobertura documental; no acredita cumplimiento funcional. Los IDs originales se conservan. Cada spec y sus tareas detallan reglas locales y pruebas.

| RF | Especificación responsable | Verificación principal |
|---|---|---|
| RF01 | [004-catalogo-publicaciones](./004-catalogo-publicaciones/spec.md), [001-descubrimiento-ofertas](./001-descubrimiento-ofertas/spec.md), [007-busqueda-inteligente](./007-busqueda-inteligente/spec.md) | Filtros persistidos, ofertas activas, paginación y EQ-01 |
| RF02 | [004-catalogo-publicaciones](./004-catalogo-publicaciones/spec.md), [001-descubrimiento-ofertas](./001-descubrimiento-ofertas/spec.md), [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Detalle público y disponibilidad por recurso sin datos ajenos |
| RF03 | [004-catalogo-publicaciones](./004-catalogo-publicaciones/spec.md) | Propietario/proveedor verificado y desactivación |
| RF04 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Rangos por unidad/agenda, EQ-07 |
| RF05 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Solicitud pendiente sin bloqueo |
| RF06 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Oficio con descripción y fecha/cotización |
| RF07 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Aceptación/rechazo/cancelación autorizados |
| RF08 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Historial solo de participantes |
| RF09 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Culqi sandbox verificado, EQ-08 |
| RF10 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Outbox y canal externo con reintento/deduplicación |
| RF11 | [006-reputacion-confianza](./006-reputacion-confianza/spec.md) | Reserva finalizada, única reseña cliente/reserva |
| RF12 | [002-usuarios-acceso](./002-usuarios-acceso/spec.md) | Registro/login, roles y EQ-04 |
| RF13 | [003-proveedores-verificacion](./003-proveedores-verificacion/spec.md) | Verificación real y documentos privados |
| RF14 | [002-usuarios-acceso](./002-usuarios-acceso/spec.md) | Administración auditada y sesión invalida según política |
| RF15 | [004-catalogo-publicaciones](./004-catalogo-publicaciones/spec.md), [006-reputacion-confianza](./006-reputacion-confianza/spec.md) | Moderación publicaciones/reseñas con auditoría |
| RF16 | [007-busqueda-inteligente](./007-busqueda-inteligente/spec.md) | Filtros validados/IDs reales y EQ-10 |
| RF17 | [007-busqueda-inteligente](./007-busqueda-inteligente/spec.md) | Fallback y deadlines EQ-02 |
| RF18 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md), [006-reputacion-confianza](./006-reputacion-confianza/spec.md) | Transiciones de operación y evidencia asociada |
| RF19 | [006-reputacion-confianza](./006-reputacion-confianza/spec.md) | Carga/descarga privada, metadata/hash y EQ-04 |
| RF20 | [006-reputacion-confianza](./006-reputacion-confianza/spec.md) | Garantía documental e incidencia con revisión humana |
| RF21 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Intento persistido e idempotencia EQ-08 |
| RF22 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Conciliación, timeout y pago tardío EQ-08 |
| RF23 | [005-reservas-contratacion-pagos](./005-reservas-contratacion-pagos/spec.md) | Cotización versionada aceptada antes del cobro |

## Historias de usuario

| Spec | HU |
|---|---|
| [002 Usuarios y acceso](./002-usuarios-acceso/spec.md) | HU11, HU13 |
| [003 Proveedores y verificación](./003-proveedores-verificacion/spec.md) | HU12 |
| [004 Catálogo y publicaciones](./004-catalogo-publicaciones/spec.md) | HU01, HU02 |
| [005 Reservas, contratación y pagos](./005-reservas-contratacion-pagos/spec.md) | HU03, HU04, HU05, HU06, HU07, HU08, HU09, HU19, HU20 |
| [006 Reputación y confianza](./006-reputacion-confianza/spec.md) | HU10, HU14, HU17, HU18 |
| [007 Búsqueda inteligente](./007-busqueda-inteligente/spec.md) | HU01, HU15, HU16 |

## Atributos de calidad

| Escenario | Specs responsables |
|---|---|
| EQ-01/03 rendimiento y carga | 004, 001 y 008 |
| EQ-02 resiliencia IA | 007 con operaciones de 005 en paralelo durante prueba |
| EQ-04 autorización | 002–006 y regresión 008 |
| EQ-05 adapters/imports | 002–007 |
| EQ-06 móvil | 001 y 005; evaluación completa después de integrarlas |
| EQ-07 concurrencia | 005, PostgreSQL real |
| EQ-08 fiabilidad pago | 005, doble y sandbox separados |
| EQ-09 recuperación | 008 y archivos privados de 006 |
| EQ-10 calidad IA | 007 |

RC05 mensajería: 005. RC06 mapas: 003/004, respaldo manual, integración real antes de aceptación final. RC13 SDD: .specify y .claude/skills. RF15 se reparte entre moderación de publicaciones en Catálogo y reseñas en Reputación; no hay módulo de administración separado.
