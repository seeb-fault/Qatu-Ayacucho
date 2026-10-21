# Contratos — Catálogo y publicaciones

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Diseño, no API publicada.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| GET | /publicaciones | Público | filtros validados; solo ofertas activas |
| GET | /publicaciones/:id | Público | detalle público |
| POST | /publicaciones | Proveedor verificado | actor derivado de sesión |
| PATCH | /publicaciones/:id | Propietario autorizado | no acepta cambio de dueño libre |

## Extensiones propuestas para cubrir requisitos existentes

- PATCH /admin/publicaciones/:id/moderacion para moderación auditada.
- Desactivación de publicación en PATCH existente con control de propiedad.

Estas extensiones aún no están congeladas: completar DTO/estados en OpenAPI y actualizar docs antes de implementar. No se ejecutan operaciones ni llamadas externas desde estas especificaciones.

## Datos de entrada/salida propuestos

GET publicaciones: q, tipo (herramienta/servicio), categoriaId, zonaId, precioMaximoCentimos, page y limit. Propuesta textual: normalizar y usar búsqueda PostgreSQL parametrizada en título/descripción; definir configuración lingüística, índices y orden antes de implementar D04. Filtros estructurados se combinan con AND. Orden estable por id tras criterio principal; limit inicial 20 y validar límite general 50. Precio variable sin tarifa comparable no se presenta como coincidencia garantizada de presupuesto.

Respuesta: items públicos, page, limit y total; cada item contiene id, proveedorId, tipo, titulo, categoriaId, zonaId, modalidadPrecio y tarifaCentimos/unidad cuando existan. Alta/edición valida tipo/categoría, tarifa y recursos propios. Disponibilidad no se infiere del campo activa; consultar Reservas.

## Puerto interno

ConsultaCatalogo: ofertas activas, recurso estable y datos de tarifa para snapshot. No autoriza reservas ni escribe bloqueos.

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
