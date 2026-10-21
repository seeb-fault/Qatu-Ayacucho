# Contratos — Usuarios y acceso

**Base:** /api/v1, JSON, ISO 8601; actor de cookie HttpOnly. US1/US2/US3 implementadas localmente el 2026-10-19; sin despliegue operativo.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| POST | /auth/registro | Público con límite | email y contraseña; rol administrativo no aceptado del cliente |
| POST | /auth/login | Público con límite | credenciales; error genérico sin revelar si existe la cuenta |

## Rutas concretadas para US1/US2

- GET /usuarios/me: 200 con identidad pública; 401 sin sesión activa.
- PATCH /usuarios/me: entrada `{nombre}`; 200 con identidad actualizada. Se rechazan campos adicionales con 400.
- POST /auth/logout: JSON `{}`; 204, revoca sesión y limpia cookie; idempotente para sesión inválida.
- POST /auth/registro: `{email,password,nombre}`; 201 con `{usuario,expiraEn}` y cookie. 409 email normalizado duplicado. Solo rol cliente.
- POST /auth/login: `{email,password}`; 200 con `{usuario,expiraEn}` y cookie. 401 genérico para contraseña incorrecta, cuenta ausente o inactiva.
- Identidad pública: `{id,email,nombre,estado,roles}`; no incluye hash ni JWT.
- Nombre 2–100 caracteres sin espacios de borde; email válido de hasta 254, trim/lowercase; contraseña 12–128 sin transformación. Se rechazan claves adicionales en todos los DTO.
- Escrituras requieren Origin=APP_ORIGIN y application/json, también login/registro/logout. 403 para origen inválido; 429 para cuota. Cookie y expiración según D01 en research.md.
- GET /admin/usuarios: solo admin activo; query opcional pagina (entero 1–99999, defecto 1), q (texto hasta 100), estado (activo/inactivo). Devuelve `{usuarios,pagina,total,paginas}`, 20 cuentas por página, orden creado_en/id descendente y campos de identidad pública. q busca literalmente por nombre/email; claves adicionales o repetidas se rechazan.
- PATCH /admin/usuarios/:id/estado: solo admin activo; UUID válido y DTO exacto `{estadoActual,estado,motivo}`. Estados activo/inactivo diferentes; motivo trim de 10–500 caracteres. Devuelve 200 con identidad pública. 404 cuenta ausente; 409 estado desactualizado o cuenta administrativa protegida. Desactivar revoca todas sus sesiones; reactivar no las recupera. Estado/revocación/auditoría son una transacción.
- GET /admin/usuarios/:id/auditoria: solo admin activo; query pagina igual a la anterior; devuelve `{eventos,pagina,total,paginas}`, 20 eventos por página orden fecha/id descendente. Evento: `{id,actorId,usuarioId,accion,estadoAnterior,estadoNuevo,motivo,creadoEn}`. actorId y estadoAnterior son null únicamente para crear_admin vía CLI. Sin ruta para editar/borrar eventos.

El contrato fuente se sincroniza para US1/US2/US3; una definición OpenAPI legible por máquinas sigue pendiente. Aprovisionamiento CLI documentado en backend/README.md, sin endpoint público ni credenciales por defecto.

## Datos de entrada/salida propuestos

Registro: email, password y nombre; no acepta rol admin ni estado verificado. Login: email/password. Respuesta autenticada: identidad pública, roles y expiración; token solo en cookie según D01. Perfil propio: solo nombre, nunca roles/estado/passwordHash por PATCH genérico. Error de credenciales no distingue email inexistente y contraseña incorrecta.

## Puerto interno

Fachada implementada: IdentidadUsuarios.resolver(token) devuelve únicamente identidad pública activa; registro/login quedan privados al módulo y sus controladores.

IdentidadUsuarios: identidad activa, roles y permisos; nunca devuelve hash ni token a otros módulos.

## Matriz de permisos

| Acción | Anónimo | Cliente activo | Proveedor activo | Admin activo |
|---|---|---|---|---|
| Registro/login | Sí, con cuota/origen | Sí, con cuota/origen | Sí, con cuota/origen | Sí, con cuota/origen |
| Consultar/editar nombre propio | 401 | Sí | Sí | Sí |
| Editar identidad/roles/estado por perfil | No | No | No | No |
| Consultar/editar perfil ajeno por ID | Sin ruta | Sin ruta | Sin ruta | Sin ruta |
| Logout | Limpia cookie | Revoca sesión | Revoca sesión | Revoca sesión |
| Listar cuentas / consultar auditoría | 401 | 403 | 403 | Sí |
| Cambiar estado de cuenta no admin | 401 | 403 | 403 | Sí, motivo obligatorio |
| Cambiar estado de cuenta admin | 401 | 403 | 403 | 409, protegida |

Una cuenta inactiva recibe 401 aun con JWT válido. Los roles no se toman del cliente ni se conceden desde PATCH. La prueba de proveedor usa asignación controlada en la base de pruebas; no representa incorporación de proveedor de 003. El bloqueo de acceso no define cancelación o reactivación de publicaciones/reservas (D02).

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
