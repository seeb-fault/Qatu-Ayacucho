# Decisiones e investigación — Catálogo y publicaciones

## Evidencia local

ADR-002, ADR-003, ADR-005, ADR-008 gobiernan esta entrega. HU01, HU02 y RF01, RF02, RF03, RF15 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Proveedor activo/verificado para publicar; validar propietario también al editar.
- Cada unidad física tiene recursoId estable; el servicio referencia una agenda. Catálogo describe y Reservas bloquea.
- Tipo herramienta/servicio y categoría compatibles; importes enteros en céntimos PEN y unidad explícita.
- Solo publicaciones activas se descubren públicamente; cambios no reescriben snapshots previos de reserva.

## Decisiones pendientes

- D04 resuelta técnicamente en la decisión del 2026-10-26, al final de este documento.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

La decisión D04 y el contrato implementado se registran a continuación; conserva pendientes las políticas ajenas a esta entrega.

## D04 — Decisión de implementación (2026-10-26)

Se adopta búsqueda PostgreSQL `spanish` sobre título y descripción normalizados con `unaccent`, índice GIN sobre un tsvector almacenado y `plainto_tsquery` parametrizado. Todos los términos deben coincidir; filtros tipo/categoría/zona/presupuesto se combinan con AND. Orden recomendado por creación descendente e ID, precio ascendente (cotizaciones al final) e ID, o título e ID. Paginación por página, base 20, máximo 50; EQ-01 se ensaya con 20. Se limita q a 200 caracteres y page a 10000. Servicios cotizables se excluyen del filtro de presupuesto.

La oferta exige proveedor con cuenta activa, verificación aprobada y consentimiento vigente de perfil público. Cambiar el perfil invalida su aprobación según 003; las ofertas dejan de descubrirse mientras no vuelva a cumplir la condición. Se consulta la fachada de Proveedores, sin leer tablas ajenas. Esto no decide D02 ni habilita desactivación operativa de proveedores o reservas.

Herramientas: tarifa fija positiva en céntimos PEN por día; servicios: fija por servicio o a cotizar, sin importe/unidad inventados. Se conservan recursos estables, sin borrado físico; las unidades retiradas se marcan inactivas. Cambiar de tipo requiere una publicación nueva. La moderación retirada impide reactivación por el propietario; solo administración puede levantarla, con motivo y auditoría. Edición/moderación usan versionActual y transacción para rechazar cambios concurrentes.

No se implementa carga de fotos en esta entrega: las categorías asignan ilustraciones locales y la interfaz las identifica como tales. Testimonios y datos demo permanecen rotulados. Reservas, disponibilidad efectiva, pagos y mapas externos siguen fuera de esta entrega.
