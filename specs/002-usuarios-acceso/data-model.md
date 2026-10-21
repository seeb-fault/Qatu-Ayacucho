# Modelo de datos — Usuarios y acceso

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Implementación física US1/US2 en backend/migrations/usuarios/001-usuarios.sql, probada en bases aisladas el 2026-10-19; no implica despliegue productivo.

## Datos propios

usuarios; roles_usuario.

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| usuario | id, emailNormalizado, passwordHash, nombre, estado, creadoEn, version | emailNormalizado UNIQUE; hash privado |
| rol_usuario | usuarioId, rol | UNIQUE(usuarioId,rol); roles permitidos |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Normalizar email y garantizar unicidad en PostgreSQL; almacenar solo hash seguro de contraseña.
2. Una cuenta admite varios roles; el registro público nunca concede administración.
3. El actor se obtiene de la sesión; cada caso de uso verifica estado, rol y propiedad.
4. D01 resuelta en research.md: JWT de 15 minutos en cookie HttpOnly y revocación persistida.

## Fronteras

IdentidadUsuarios: identidad activa, roles y permisos; nunca devuelve hash ni token a otros módulos.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

Nombres físicos: usuarios(id, email_normalizado, password_hash, nombre, estado, creado_en, version), roles_usuario(usuario_id, rol). Estados activo/inactivo; roles cliente/proveedor/admin. UUID, timestamptz, unicidad de email normalizado y PK compuesta para roles; FK a usuarios. Registro de cuenta y rol cliente en una transacción.

Detalle operativo D01: sesiones_usuario(id, usuario_id, expira_en, revocada) con índice de usuario; limites_acceso(clave, intentos, hasta) con incremento atómico por ventana de 15 minutos. La clave por email contiene SHA-256; nunca la contraseña. migraciones registra versiones aplicadas con bloqueo transaccional. Hay SQL de rollback manual en 001-usuarios.down.sql.

Migración 002-administracion: auditoria_usuarios(id UUID, actor_id FK nullable, usuario_id FK, accion, estado_anterior nullable, estado_nuevo, motivo, creado_en timestamptz). Acciones crear_admin y cambiar_estado; CHECK obliga actor/estados coherentes y motivo trim de 10–500 caracteres. Índice usuario/fecha/id para paginación. No guarda contraseña, hash ni token. Actor null solo para aprovisionamiento CLI.

La limpieza periódica de filas expiradas sigue pendiente antes de operación sostenida. No se almacenan JWT completos ni refresh tokens. El rol admin se crea solo por CLI sobre cuenta nueva; no se modifica desde HTTP. Auditoría de cambios exitosos insertada en la misma transacción que estado/revocación; sin endpoints para modificarla o borrarla. El script migrate aplica 001 y 002 en orden bajo el bloqueo/historial ya existentes; downgrade de 002 es manual y elimina auditoría.
