# Decisiones e investigación — Proveedores y verificación

## Evidencia local

ADR-002, ADR-005, ADR-007, ADR-012 gobiernan esta entrega. HU12 y RF13 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Un perfil de proveedor por usuario; identidad consultada por fachada de Usuarios.
- Solo administrador autorizado resuelve verificación; el proveedor no se autoaprueba.
- Documentos de verificación no aparecen en perfil público; descargas requieren permiso.
- Mapas por adapter y distrito manual como respaldo. La caída del mapa no impide completar la zona manual.

## Decisiones pendientes

- D02: tratamiento de publicaciones y reservas existentes al desactivar un proveedor; pendiente antes de desactivación operativa.
- D03 mapas: proveedor externo por seleccionar; este incremento usa los cuatro distritos manuales del catálogo inicial. No se finge geocodificación ni se realizan llamadas externas.

## D03 documental — decisión del usuario, 2026-10-19

El usuario solicitó documentos reales y eligió «Conservar archivos mientras el proveedor esté activo». En este incremento el estado activo se obtiene de Usuarios; la desactivación operativa del proveedor continúa bloqueada por D02. No se recibieron ni utilizaron documentos personales durante las pruebas.

- PDF (1.x/2.x), JPEG y PNG; uno o dos adjuntos de hasta 5 MiB cada uno. Se valida cantidad, tamaño, MIME y firma; esto no sustituye un antivirus ni un análisis semántico completo de PDF. Descargas attachment, nosniff y CSP sandbox; no hay vista inline ni URLs públicas.
- Recepción multipart limitada exclusivamente a POST /proveedores/me/verificaciones, con Origin exacto y guarda de identidad previa al procesamiento de archivos. El servidor vuelve a validar identidad/propiedad en aplicación. Cada solicitud exige consentimiento explícito a cuenta_activa_v1 y versión actual.
- Archivos cifrados AES-256-GCM en PostgreSQL mediante adapter privado, IV aleatorio de 12 bytes, tag de 16 y UUID como AAD. DOCUMENTOS_KEY es una clave hex de 32 bytes externa al repositorio/DB; sin ella no se aceptan cargas. No se conservan nombres originales. IDs, tipo, tamaño y hash son metadatos privados.
- La base de datos contiene bytes cifrados, no archivos públicos. Esta elección local mantiene adjuntos y solicitud en una transacción y no introduce una cuenta de almacenamiento externa. El puerto permite cambiar de adapter; evaluar almacenamiento externo/límites operativos en 008.
- Solo propietario activo o admin activo descarga, y solo mientras la cuenta propietaria esté activa. El público recibe exclusivamente nombre público, descripción, zona y estado real. La autorización precede a descifrar.
- Limpieza al arrancar y cada hora mientras la API esté en ejecución; npm run documentos:limpiar permite ejecución explícita. Al detectar una cuenta inactiva se eliminan contenido/IV/tag de sus adjuntos, se cancela cualquier revisión pendiente y se reinicia la verificación actual. Se conservan decisiones, motivos, revisor, fecha, perfil enviado y metadatos que acreditan eliminación. Reactivar no restaura adjuntos eliminados.
- La limpieza se decide al detectar inactividad, incluso si la cuenta se reactiva durante el lote; deberá reenviar documentos. La eliminación lógica en PostgreSQL no promete borrado físico instantáneo de WAL/backups. En 008 definir retención de copias, restauración sin reintroducir documentos eliminados, custodia de claves y monitoreo de limpieza. La clave no se rota sin migración de cifrado.
- Verificación: no_solicitada → pendiente → aprobada/rechazada. Solo otro admin resuelve con motivo de 10–500 caracteres y solicitudId; el dueño, aun siendo admin, no se revisa a sí mismo. Perfil y resolución se actualizan juntos bajo bloqueo de fila. Historial con perfil enviado conservado; 409 ante solicitud resuelta o concurrente.
- Datos públicos del perfil quedan bloqueados durante revisión salvo visibilidad. Cambiar nombre/descripción/zona después de resolución reinicia la verificación; no borra decisiones ni archivos mientras siga activo. Hasta tres solicitudes en 24 horas, una pendiente por proveedor. Historial propio muestra últimas 20; cola administrativa paginada y filtrada por estado.
- Crear perfil o aprobar documentación no publica ofertas ni concede roles desde el cliente. La integración de habilitación de Catálogo (004) debe consumir ConsultaProveedores y la identidad activa; no se escribe directamente en roles de Usuarios desde este módulo.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Perfiles, revisión documental y consulta pública implementados localmente según esta decisión. D02 y el adapter externo de mapas permanecen pendientes; no hay endpoint de desactivación operativa ni integración de Catálogo. Resultados y límites en quickstart.md.
