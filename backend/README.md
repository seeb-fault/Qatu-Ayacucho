# API Qatu — Usuarios y Proveedores

NestJS 11/TypeScript, PostgreSQL y puertos por módulo. Implementa registro, login, perfil propio, logout y administración auditada (US1/US2/US3, RF12/RF14). El catálogo del frontend conserva fixtures.

Proveedores 003 añade perfil propio, zona manual, consulta pública optativa, documentación cifrada y revisión administrativa con historial. Aplicar todas las migraciones antes de arrancar: el módulo limpia adjuntos de cuentas inactivas al iniciar y cada hora. Configuración y conservación en [PROVEEDORES.md](./PROVEEDORES.md).

## Desarrollo local

Requisitos: Node.js 22+ y PostgreSQL. Desde la raíz de Qatu, `docker compose up -d db` prepara PostgreSQL/PostGIS en 127.0.0.1:5433 con volumen persistente. Alternativamente usar una base PostgreSQL local dedicada.

Desde backend:

```powershell
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copiar el secreto generado en JWT_SECRET de .env. Configurar DATABASE_URL; APP_ORIGIN debe coincidir exactamente con el origen del navegador (por defecto http://127.0.0.1:3000).

```powershell
npm run migrate
npm run dev
```

En otra terminal, desde frontend: `npm run dev`. Abrir http://127.0.0.1:3000/registro. Next.js reenvía /api/v1 al backend loopback:3001; QATU_API_URL permite cambiarlo y requiere reconstrucción para `next start`.

La migración es transaccional, con bloqueo e historial; repetir migrate no borra datos. El archivo .down.sql documenta el rollback manual destructivo y no se ejecuta automáticamente.

## Verificación

`npm run build` compila. `npm test` ejecuta validación/hash; las pruebas HTTP/PostgreSQL se omiten explícitamente sin TEST_DATABASE_URL.

Usar una base exclusiva de pruebas, migrarla con DATABASE_URL apuntando a ella y luego:

```powershell
$env:TEST_DATABASE_URL='postgresql://qatu:qatu_local@127.0.0.1:5433/qatu_test'
npm test
```

Los ensayos generan cuentas sintéticas; no usar una base personal/producción. Desde frontend, `npm run build` y `npm run test:usuarios` verifican el recorrido con navegador/API/base reales. Para ese ensayo el backend utiliza su .env, APP_ORIGIN se fija en 127.0.0.1:3100; la API y los puertos 3001/3100 deben estar libres. `npm test` conserva la regresión de descubrimiento sin requerir backend.

## Crear un administrador

Aplicar `npm run migrate` también en bases que ya tienen Usuarios 001: la migración 002 añade auditoría sin recrear cuentas. Desde backend, con DATABASE_URL configurada y acceso de operador, crear una cuenta nueva con correo exclusivo. Si el correo ya existe, el comando se rechaza; no eleva permisos de una cuenta pública.

```powershell
$env:QATU_ADMIN_EMAIL = Read-Host 'Correo del nuevo administrador'
$env:QATU_ADMIN_NOMBRE = Read-Host 'Nombre'
$env:QATU_ADMIN_MOTIVO = Read-Host 'Motivo del aprovisionamiento (10–500 caracteres)'
$claveAdmin = Read-Host 'Contraseña (12–128 caracteres)' -AsSecureString
try {
  $env:QATU_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $claveAdmin).Password
  npm run admin:crear
} finally {
  Remove-Item Env:QATU_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:QATU_ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:QATU_ADMIN_NOMBRE -ErrorAction SilentlyContinue
  Remove-Item Env:QATU_ADMIN_MOTIVO -ErrorAction SilentlyContinue
  $claveAdmin.Dispose()
}
```

No guardar estas variables QATU_ADMIN_* en .env ni en comandos con contraseñas literales. El script devuelve solo el UUID creado y guarda la creación en auditoría. No proporciona una contraseña por defecto ni promueve cuentas existentes.

Ingresar desde /ingresar; el perfil administrativo muestra «Administrar usuarios». En /admin/usuarios se filtra por nombre/correo/estado, se revisa auditoría paginada y se confirma el cambio con motivo. Las cuentas admin están protegidas contra cambios HTTP. La gestión/retiro de sus permisos requiere una operación controlada fuera de esta pantalla.

Desactivar revoca todas las sesiones; reactivar requiere login nuevo. Una cuenta cuyo estado cambió desde que se mostró devuelve 409; actualizar listado antes de repetir. Cambios de estado, revocación y auditoría se confirman juntos o se revierten juntos. Esto no define qué hacer con publicaciones/reservas futuras de proveedores (D02 pendiente).

## Límites operativos

No hay renovación ni recuperación de contraseña; las sesiones expiran a los 15 minutos. Logout revoca en servidor. No hay asignación pública de roles ni eliminación HTTP de auditoría. Las cuotas por IP detrás del proxy se comparten; revisar proxy y cuotas antes de publicar. HTTPS, limpieza programada de sesiones/cuotas expiradas, OpenAPI estructurado y aceptación global de EQ-04/EQ-05 siguen pendientes. Las credenciales de Compose son exclusivamente locales. La auditoría no sustituye copias de seguridad ni protección del acceso directo a PostgreSQL.

Referencias de implementación: [NestJS](https://docs.nestjs.com/security/authentication), [scrypt de Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback). Política concreta en specs/002-usuarios-acceso/research.md.
