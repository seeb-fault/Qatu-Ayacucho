# Modelo de datos — Proveedores y verificación

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Implementación física local en backend/migrations/proveedores; no implica despliegue operativo.

## Datos propios

proveedores; verificaciones.

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| proveedor | id, usuarioId, zonaId, descripcion, estado, estadoVerificacion, version | usuarioId UNIQUE; usuario por contrato |
| verificacion | id, proveedorId, documentoPrivadoId, estado, motivo, revisorId, revisadoEn | solo revisor autorizado; historial y archivo privado |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Un perfil de proveedor por usuario; identidad consultada por fachada de Usuarios.
2. Solo administrador autorizado resuelve verificación; el proveedor no se autoaprueba.
3. Documentos de verificación no aparecen en perfil público; descargas requieren permiso.
4. Mapas por adapter y distrito manual como respaldo. La caída del mapa no impide completar la zona manual.
5. Catálogo consulta estado activo/verificado antes de publicar; desactivación debe impedir nuevas operaciones según política D02.

## Fronteras

ConsultaProveedores: perfil público, zona y estado; documentos y observaciones internas permanecen privados.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

001-perfiles: zonas_proveedor(id,nombre) con cuatro distritos del catálogo inicial; proveedores(id,usuario_id UNIQUE FK a usuarios,nombre_publico,descripcion,zona_id FK propia,visible_publicamente,estado_verificacion,version,creado_en,actualizado_en). Visibilidad requiere boolean explícito del dueño; la versión impide sobrescritura concurrente. No se introduce estado de desactivación operativa hasta resolver D02.

002-verificaciones: verificaciones_proveedor(id,proveedor_id,estado,politica_conservacion,perfil_enviado,motivo,revisor_id,creado_en,revisado_en), con índice único parcial de pendiente por proveedor e historial por fecha. Snapshot de nombre/descripción/zona y política cuenta_activa_v1; motivo/revisor/fecha obligatorios para decisiones. Cancelación de conservación usa revisor null y motivo automático.

documentos_proveedor(id,verificacion_id,tipo,bytes,sha256,contenido,iv,tag,eliminado_en,creado_en): bytea cifrado AES-GCM, hasta 5 MiB por archivo; tipo limitado a PDF/JPEG/PNG, IV 12 y tag 16. Sin nombres originales ni rutas públicas. SHA-256 privado identifica el archivo del envío; nunca se devuelve al público. Clave externa en DOCUMENTOS_KEY. Eliminación conserva metadatos y marca eliminado_en, pone contenido/IV/tag en NULL y reinicia estado del perfil, sin borrar decisiones.

FK a Usuarios refuerzan integridad, no autorizan lecturas de sus tablas desde Proveedores. Identidad/estado/roles se consumen por IdentidadUsuarios. Solicitud+adjuntos+perfil y resolución+perfil se confirman respectivamente en transacción. Las migraciones tienen rollback manual; 002 down elimina historial/archivos y reinicia verificación, nunca se ejecuta automáticamente.
