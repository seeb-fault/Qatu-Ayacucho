# Contratos — Catálogo y publicaciones

Implementación Spec 004. Base `/api/v1`; sesión HttpOnly existente, CSRF por Origin/JSON y actor derivado del servidor. D04 resuelta en research.md el 2026-10-26.

| Método | Ruta | Acceso |
|---|---|---|
| GET | /publicaciones | Público; solo activas, permitidas y proveedor habilitado |
| GET | /publicaciones/opciones | Categorías, zonas, unidades y modalidades admitidas |
| GET | /publicaciones/mias | Sesión; lista paginada de publicaciones propias, incluso retiradas |
| GET | /publicaciones/:id | Público; 404 si no visible |
| POST | /publicaciones | Proveedor activo, aprobado y con perfil público |
| PATCH | /publicaciones/:id | Mismo proveedor, activo y aprobado; versionActual obligatoria |
| GET | /admin/publicaciones | Admin activo, listado paginado incluyendo retiradas |
| PATCH | /admin/publicaciones/:id/moderacion | Admin; estado `permitida`/`retirada`, motivo y versionActual |
| GET | /admin/publicaciones/:id/auditoria | Admin; historial de moderación |

GET listado: `q` (hasta 200 caracteres), `tipo`, `categoriaId`, `zonaId`, `precioMaximoCentimos` (entero 0..99999999), `page` (1..10000), `limit` (1..50, predeterminado 20), `orden` (`recomendados`, `precio`, `nombre`). Filtros AND, búsqueda española sin tildes; orden estable por ID tras criterio principal. Precio máximo excluye cotizables. Parámetros repetidos/desconocidos o tipos incompatibles: 400. Respuesta `{items,page,limit,total}`; páginas superiores al total devuelven items vacíos.

POST/PATCH: `{tipo,categoriaId,zonaId,titulo,descripcion,incluye,condiciones,modalidadPrecio,tarifaCentimos,unidad,activa,recursos}`. Título 5..120; descripción 20..3000; incluye/condiciones listas de 1..10 textos de 2..200. Herramienta fija, importe 1..99999999, unidad `día`; servicio fijo/unidad `servicio` o cotización con importe y unidad null. Recurso `{id?:UUID,identificador:string,activo:boolean}`: 1..20 unidades físicas de herramienta o una agenda de servicio, etiquetas únicas de 1..80 caracteres; al crear se omite id, al editar se conservan todos los IDs previos (retirar con activo:false). Una publicación activa necesita algún recurso activo. El tipo es inmutable.

PATCH añade `versionActual` entero positivo; no acepta proveedorId, usuarioId, estadoModeracion ni campos privados. No hay borrado físico. Edición ajena 403, inexistente 404, versión obsoleta o reactivación retirada 409. Moderación retirada no es reversible por el dueño; levantarla no reactiva automáticamente una oferta que el propietario dejó inactiva.

Las respuestas públicas incluyen id, proveedorId, tipo, categoría, zona, título, descripción, incluye/condiciones, modalidadPrecio, tarifaCentimos/unidad/PEN, recursos e ilustración local; proveedor contiene solo id/nombrePublico/estadoVerificacion. Nunca usuarioId, correo ni documentos. Consultas propias/admin añaden activa, estadoModeracion y version. Auditoría registra actor, motivo, transición, versión e instante UTC.

Puerto `ConsultaCatalogo.consultar(id)`: oferta activa y recursos estables para futuros snapshots; no reserva, bloquea ni calcula disponibilidad. Fachada Proveedores expone proyecciones habilitadas por lote y perfil propio, sin repositorios ajenos.

Errores `{code,mensaje,correlationId}`: 400 validación, 401 sin sesión, 403 sin permiso, 404 inexistente/no visible, 409 conflicto. Sin stack ni secretos. Mutaciones revalidan sesión y propiedad además de validación de DTO.
