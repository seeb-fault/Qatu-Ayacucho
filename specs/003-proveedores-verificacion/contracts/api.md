# Contratos — Proveedores y verificación

**Base:** /api/v1, JSON excepto la carga multipart, ISO 8601; actor de la sesión HttpOnly de Usuarios. Implementación local de perfiles/revisión; sin despliegue operativo.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| GET | /proveedores/zonas | Público | Cuatro distritos iniciales; selección manual |
| GET/POST/PATCH | /proveedores/me | Cuenta activa | Propietario obtenido de sesión; sin override administrativo |
| GET | /proveedores/:id | Público | UUID; consentimiento de visibilidad y cuenta activa |
| GET | /proveedores/politica-documental | Público | Disponibilidad, tipos, límites y conservación; nunca la clave |
| GET/POST | /proveedores/me/verificaciones | Propietario activo | Historial / solicitud documental privada |
| GET | /proveedores/documentos/:id | Dueño/admin activo | Cuenta propietaria activa; descarga attachment |
| GET | /admin/proveedores/verificaciones | Admin activo | Cola e historial filtrado y paginado |
| POST | /admin/proveedores/:id/verificacion | Otro admin activo | Decisión con motivo y solicitudId |

## DTO implementados

- POST /proveedores/me recibe `{nombrePublico,descripcion,zonaId,visiblePublicamente}`: nombre trim 2–100, descripción trim 20–1500, zona existente, visibilidad boolean explícita. 201 con perfil propio; 409 duplicado normalizado por usuario. No acepta usuarioId/roles/estadoVerificacion ni otros campos.
- GET /proveedores/me: 200 con `{id,usuarioId,nombrePublico,descripcion,zonaId,zona,visiblePublicamente,estadoVerificacion,version,creadoEn,actualizadoEn}`; 404 sin perfil. Zona es `{id,nombre}`.
- PATCH /proveedores/me recibe los cuatro campos y `versionActual` entero positivo. 200 con nueva versión, 409 si está desactualizada. Datos de nombre/descripción/zona congelados mientras pendiente; sí puede cambiar visibilidad. Una modificación de esos datos después de resolución reinicia verificación, sin borrar historial ni adjuntos de cuentas activas.
- GET /proveedores/:id: solo `{id,nombrePublico,descripcion,zona,estadoVerificacion}`. Oculto, inexistente o cuenta inactiva → 404 incluso si quien consulta es el dueño. No devuelve usuarioId, email, motivos, documentos, revisores ni versión.
- POST /proveedores/me/verificaciones: multipart con `versionActual` decimal y `aceptaConservacion=true`, más 1–2 partes `documentos`. PDF/JPEG/PNG de hasta 5 MiB cada una; firma/MIME/tamaño comprobados. 201 con solicitud; 400 por DTO/tipo/consentimiento, 413 por tamaño, 409 si revisión pendiente/aprobada o perfil cambió, 429 tras tres solicitudes en 24 horas. Sin DOCUMENTOS_KEY válida, 503; no se guardan bytes sin cifrar.
- GET /proveedores/me/verificaciones: últimas 20 solicitudes, orden fecha/id descendente. Cada una `{id,estado,motivo,revisorId,creadoEn,revisadoEn,perfilEnviado,documentos}`. Documento resumen `{id,tipo,bytes,disponible}`; nunca datos cifrados, IV, tag, hash, clave ni nombre original. perfilEnviado guarda nombrePublico/descripcion/zonaId del envío.
- GET /proveedores/documentos/:id: dueño/admin activo; 401 anónimo/inactivo, 404 ajeno/inexistente/eliminado/cuenta propietaria inactiva. Descifra después de autorizar; Content-Disposition attachment con nombre UUID, Cache-Control no-store, nosniff y CSP sandbox. No existe endpoint público de archivos.
- GET /admin/proveedores/verificaciones admite `pagina` 1–99999 (defecto 1) y `estado` pendiente/aprobada/rechazada/cancelada (defecto pendiente). Devuelve `{solicitudes,pagina,total,paginas}`, 20 por página, fecha/id ascendente; cada solicitud incluye perfil actual privado y perfilEnviado. Se rechazan filtros desconocidos.
- POST /admin/proveedores/:id/verificacion recibe `{solicitudId,decision,motivo}`: UUID, decisión aprobada/rechazada, motivo trim 10–500. Solo otro admin activo. 201 con decisión auditada, 403 por no admin o autoevaluación, 404 si solicitud no pertenece al perfil o cuenta no disponible, 409 ya resuelta/sin adjuntos. Resolución y estado del perfil se confirman juntos bajo bloqueo; no hay decisión aprobada sin documentos presentes.
- PATCH /admin/proveedores/:id/estado permanece pendiente de D02; no se expone en este incremento.

Contrato textual sincronizado con el diseño externo. OpenAPI estructurado sigue pendiente. La integración de Catálogo y mapas externos no se presenta como implementada.

## Datos de entrada/salida propuestos

Estado actual: no_solicitada/pendiente/aprobada/rechazada. Historial añade cancelada, exclusivamente al purgar documentos de una cuenta inactiva. Los campos de verificación nunca son editables desde perfil. Solicitud, consentimiento cuenta_activa_v1, snapshot y adjuntos cifrados se guardan juntos. Limpieza al arrancar/cada hora y por CLI elimina contenido/IV/tag, conserva decisiones y reinicia estado; reactivar requiere reenviar adjuntos eliminados.

## Puerto interno

ConsultaProveedores: perfil público, zona y estado; documentos y observaciones internas permanecen privados.

Implementado como ConsultaProveedores.consultar(id). Usuarios aporta resolver(token) y cuentaActiva(usuarioId); Proveedores no consulta tablas/repositories ajenos. Roles de Usuarios no se modifican aquí; habilitación de publicar se integra en 004.

## Matriz de acceso

| Acción | Anónimo | Dueño activo | Otro cliente/proveedor | Admin activo |
|---|---|---|---|---|
| Ver zonas/política | Sí | Sí | Sí | Sí |
| Ver perfil visible de cuenta activa | Sí | Sí | Sí | Sí |
| Crear/editar perfil propio | 401 | Sí, con versión | Solo el propio | Solo el propio |
| Historial/envío documental propio | 401 | Sí | Solo el propio | Solo el propio |
| Descargar adjunto | 401 | Sí | 404 | Sí si dueño sigue activo |
| Listar/revisar solicitudes | 401 | 403 sin rol admin | 403 | Sí; perfil propio 403 |

No hay override de propiedad mediante IDs en el cuerpo. Archivos no permiten HTML/SVG, no tienen vista inline ni nombres originales públicos. Validación por firma no equivale a certificación de autenticidad o análisis antivirus; la decisión humana y la operación segura se validan por separado.

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
