# Modelo de datos — Catálogo y publicaciones

Implementado el 2026-10-26. Migración `backend/migrations/catalogo/001-publicaciones.sql`; rollback manual separado, nunca automático.

| Tabla propia | Responsabilidad y restricciones |
|---|---|
| catalogo_publicaciones | UUID, proveedorId lógico, tipo/categoría compatibles, zona, título/descripcion, incluye/condiciones JSON, activa, moderación, versión e instantes UTC |
| catalogo_categorias | Diez categorías de herramientas y servicios; clave compuesta con tipo para impedir incompatibilidades |
| catalogo_zonas | Cuatro distritos admitidos, sin geocodificación |
| catalogo_tarifas | Una tarifa por publicación, PEN, céntimos enteros positivos hasta 99999999; herramienta por día, servicio por servicio o cotización sin importe/unidad |
| catalogo_recursos | UUID estable, publicación, clase unidad_fisica/agenda, etiqueta única por oferta y estado activo; no se borran para editar |
| catalogo_auditoria | Moderación con actor, transición, motivo de 10..500 caracteres, versión e instante UTC |

No hay claves físicas hacia tablas de otros módulos ni consultas a sus repositorios. La identidad y habilitación se consultan por fachadas Usuarios/Proveedores. El DTO público no contiene email, usuarioId, documentos ni decisiones de auditoría.

Validación de dominio y constraints PostgreSQL impiden precios/tipos incompatibles, etiquetas duplicadas y publicaciones activas sin unidades activas. Triggers diferidos verifican al COMMIT que exista tarifa compatible y de una a veinte unidades (una agenda en servicios). Las transacciones crean/actualizan publicación, tarifa y recursos en conjunto; la moderación y su auditoría también son atómicas. FOR UPDATE y versionActual rechazan escrituras concurrentes con 409.

Búsqueda: trigger actualiza tsvector `spanish` con `unaccent`, índice GIN y parámetros enlazados. Índices de lectura pública, proveedor, filtros, precio y auditoría. Orden estable con ID final; orden por nombre usa collation C. Los intervalos de disponibilidad y los snapshots de reservas se implementarán en 005, sin derivarlos de `activa`.

La edición conserva todos los recursos previos y sus IDs; las unidades retiradas se marcan inactivas. La baja de cuentas o pérdida de consentimiento/verificación oculta ofertas al consultar la fachada; no decide la política D02 de reservas existentes.
