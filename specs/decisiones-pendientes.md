# Decisiones pendientes de implementación

Estos puntos ya estaban abiertos en docs o se detectaron al concretar sus contratos. Las especificaciones son borradores para las tareas afectadas, no planes listos para ejecutar sin aclaraciones.

| ID | Decisión | Spec | Bloquea |
|---|---|---|---|
| D01 | Resuelta 2026-10-19: cookie HttpOnly/Strict, JWT 15 min, sesiones revocables en PostgreSQL, validación de origen; sin renovación automática. | [002](./002-usuarios-acceso/research.md) | Sin bloqueo para US1/US2; revisar proxy antes de producción |
| D02 | tratamiento de publicaciones y reservas existentes al desactivar un proveedor; pendiente antes de desactivación operativa. | [003](./003-proveedores-verificacion/research.md) | Operación indicada en la descripción |
| D03 | Documental resuelta 2026-10-19 por el usuario: documentos reales conservados mientras esté activo; límites/cifrado/limpieza en research. Proveedor de mapas externo pendiente; distrito manual disponible. | [003](./003-proveedores-verificacion/research.md) | Integración externa de mapas y aceptación operativa de conservación/copias |
| D04 | búsqueda textual y contrato de filtros/orden/paginación; propuesta en contratos de esta entrega, revisar antes de congelar API. | [004](./004-catalogo-publicaciones/research.md) | Operación indicada en la descripción |
| D05 | días calendario o bloques 24 h, retiro/devolución, mínimos y tarifa; bloquea cálculo comercial. | [005](./005-reservas-contratacion-pagos/research.md) | Operación indicada en la descripción |
| D06 | secuencia cotización/aceptación/bloqueo, vencimiento (15 min propuesto), anticipo y vigencia; bloquea aceptación/cobro de oficio. | [005](./005-reservas-contratacion-pagos/research.md) | Operación indicada en la descripción |
| D07 | comisión, cancelaciones, reembolsos y pago tardío; bloquea checkout operativo. | [005](./005-reservas-contratacion-pagos/research.md) | Operación indicada en la descripción |
| D08 | credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real. | [005](./005-reservas-contratacion-pagos/research.md) | Operación indicada en la descripción |
| D09 | límites de archivo, retención/borrado, política de garantía y responsables de revisión antes de habilitar cargas/garantías. | [006](./006-reputacion-confianza/research.md) | Operación indicada en la descripción |
| D10 | proveedor/modelo, presupuesto mensual, cuota por actor y anonimato de métricas; pendiente antes de activar llamadas facturables. | [007](./007-busqueda-inteligente/research.md) | Operación indicada en la descripción |
| D11 | Host/dominio, presupuesto, destino/retención de copias y alertas | [008](./008-despliegue-validacion/research.md) | Publicación y aceptación operativa |

## Forma de resolver

Registrar decisión, motivo, alternativas y fecha en research de la entrega; actualizar ADR/contratos/specs afectados y sus tareas. Las decisiones técnicas reversibles se resuelven durante el plan; las políticas comerciales se precisan antes del flujo afectado. La política de calendario observada en Hygglo no define automáticamente el cobro de Qatu.

No hay requisito de pedir permiso por cada archivo o tarea. Esta lista identifica información pendiente y evita inventar políticas o credenciales.

D12: protocolo de coherencia de hito/evidencia entre Reservas y Reputación; afecta RF18/RF19. [Detalle](./005-reservas-contratacion-pagos/research.md).
