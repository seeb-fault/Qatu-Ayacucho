# Decisiones e investigación — Usuarios y acceso

## Evidencia local

ADR-001, ADR-002, ADR-007 gobiernan esta entrega. HU11, HU13 y RF12, RF14 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Normalizar email y garantizar unicidad en PostgreSQL; almacenar solo hash seguro de contraseña.
- Una cuenta admite varios roles; el registro público nunca concede administración.
- El actor se obtiene de la sesión; cada caso de uso verifica estado, rol y propiedad.
- Token de corta duración y almacenamiento protegido; D01 resuelta abajo.

## D01 — Sesión web (2026-10-19)

- Decisión técnica de implementación: JWT HS256 de 15 minutos, issuer/audience fijos, secreto aleatorio externo de al menos 32 caracteres. No se devuelve el token en JSON ni se usa localStorage.
- Cookie `qatu_sesion`, HttpOnly, SameSite=Strict, Path=/api/v1, sin Domain y Secure en producción. Web y API comparten origen mediante proxy Next.js; APP_ORIGIN exacto obligatorio en todas las escrituras y Content-Type application/json. Se rechazan solicitudes cross-site. No se habilita CORS.
- PostgreSQL conserva sesiones con UUID, usuario, expiración y revocación. Cada acción privada consulta sesión y cuenta activa; logout revoca y limpia cookie. Desactivar la cuenta impide acceso de inmediato. No hay renovación automática: al expirar se requiere login.
- Registro público crea únicamente rol cliente. Incorporación de proveedor corresponde a 003; administración se aprovisionará fuera del registro público. PATCH de perfil solo permite nombre.
- Contraseñas de 12–128 caracteres, hash scrypt con salt aleatorio de 16 bytes, N=32768/r=8/p=3 y comparación de tiempo constante. Sin normalizar ni truncar la contraseña.
- Límites persistidos por ventana de 15 minutos: 10 registros/IP, 30 logins/IP y 10 logins/email normalizado (clave SHA-256). IP determinada por conexión, sin confiar en X-Forwarded-For. Detrás del proxy la cuota IP es compartida; configurar proxies confiables y revisar cuotas antes de despliegue público.
- Alternativa descartada para este incremento: refresh tokens y rotación, por mayor superficie operativa. La sesión corta permite comenzar sin política de renovación adicional.
- Responsable: implementación asistida solicitada por el usuario. Se conservan JWT y monolito previstos por ADR-007. US3 se concreta en la decisión siguiente.

## US3 — Administración de cuentas (2026-10-19)

- Aprovisionar una cuenta administrativa nueva mediante CLI local con acceso a DATABASE_URL; nombre/email/contraseña/motivo se reciben por variables de entorno. Se rechaza cualquier email existente: nunca se promueve automáticamente una cuenta registrada públicamente. No se crean credenciales predeterminadas ni endpoints de asignación de roles.
- Administradores activos pueden listar cuentas, consultar auditoría y cambiar activo/inactivo con motivo de 10–500 caracteres. Paginación de 20; búsqueda por nombre/email hasta 100 caracteres y filtro por estado.
- Cuentas con rol admin están protegidas de cambios de estado HTTP, incluida la propia, para evitar perder acceso administrativo. La gestión/retiro de administradores se hará por operación controlada fuera de este flujo.
- PATCH exige estadoActual y estado destino diferente. Un bloqueo de fila valida el estado esperado; si otra operación lo cambió, 409 sin auditoría duplicada. Actor activo/rol admin se comprueban en aplicación y de nuevo dentro de la transacción.
- Estado, incremento de versión, revocación de todas las sesiones y auditoría se confirman en una transacción. Crear sesión también bloquea la cuenta y revisa su estado: un login concurrente no elude la desactivación. Reactivar exige login nuevo; no revive cookies anteriores.
- Auditoría registra UUID, actor (null solo para CLI), cuenta afectada, acción, estado previo/nuevo, motivo y fecha UTC; no contraseñas, hashes ni tokens. No hay endpoint de edición/borrado de auditoría. Fallos de autorización/validación no alteran el historial de cambios exitosos.
- Esta acción cambia acceso a la cuenta. No resuelve D02 ni cancela/reactiva publicaciones o reservas: esa política operativa sigue pendiente en 003 y debe concretarse antes de integrar esos módulos.

## Alternativas de administración

Se protege cualquier cuenta admin en lugar de contar administradores activos durante cada cambio; el aprovisionamiento exige cuenta nueva en lugar de promover una identidad pública sin verificación previa. OpenAPI estructurado y la aceptación global de calidad permanecen pendientes.

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

D01 y políticas técnicas US3 resueltas; las tres historias tienen implementación local. Evidencia y límites de aceptación global en quickstart.md.
