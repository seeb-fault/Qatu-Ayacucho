# Validación y recorrido — Proveedores y verificación

## Preparación

Aplicación local ejecutable para perfiles, documentación y consulta pública. Preparar PostgreSQL y ejecutar npm run migrate desde backend. Configurar DATABASE_URL/JWT_SECRET/APP_ORIGIN según backend/README.md y DOCUMENTOS_KEY estable según backend/PROVEEDORES.md. La carga queda deshabilitada sin clave válida; perfiles y consulta pública siguen disponibles. No se utilizan documentos personales en pruebas.

backend: npm run build y npm test; TEST_DATABASE_URL habilita integración y debe apuntar a una base exclusiva migrada. Sin esa variable la integración se omite explícitamente. La prueba de atomicidad instala y retira un trigger temporal que rechaza una decisión.

frontend: npm run build; luego npm run test:proveedores, npm run test:usuarios y npm test en secuencia. Suites de proveedores/usuarios inician API 3001 y web 3100; requieren DATABASE_URL, JWT_SECRET y DOCUMENTOS_KEY en entorno o backend/.env. Los ensayos generan cuentas UUID/example.com y adjuntos sintéticos, no identidades reales.

## Recorridos

1. US1: dado una cuenta activa, completo perfil y distrito; comprobar que se registra un perfil propio sin duplicarlo.
2. US2: dado documentos privados remitidos, apruebo o rechazo con motivo; comprobar que el resultado queda auditado y solo una aprobación válida habilita publicación.
3. US3: dado un perfil visible, consulto sus datos; comprobar que veo información pública y estado real, nunca documentos privados.

## Casos críticos

- Perfil duplicado y usuario inexistente/inactivo.
- Acceso a documento propio, ajeno y administrativo; URL no pública.
- Fallo de mapas conserva selección manual; estado de verificación no modificable por cliente.

## Registro de resultados

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | 2026-10-19, base Git 3e3dcb4, cambios locales sin commit. Windows/PowerShell, Node 24.21.0/npm 11.19.0, PostgreSQL 18.4, NestJS 11 y Next 16.4.1. Sin nuevas dependencias. |
| Fixture y condiciones | PostgreSQL aislado .local-postgres, loopback:5433. Bases qatu_003_documentos_test y qatu_003_aceptacion_web; cuentas UUID en example.com, PNG sintético y fixtures de transporte con firma PDF. Claves de ensayo efímeras; ningún documento personal. |
| Comandos ejecutados | backend: npm run migrate (incluida repetición), npm run build, npm test con TEST_DATABASE_URL. frontend: npm run build y suites test:proveedores/test:usuarios/test secuenciales. validar-specs.ps1 e inspección de imports. |
| Resultados positivos/negativos | Backend: 35 pruebas pasan, 0 omitidas; incluye regresión Usuarios y perfiles/documentos de Proveedores. Chrome: 6 pruebas de Proveedores pasan; creación/recarga/visibilidad, versión entre pestañas, acceso anónimo, envío/revisión/historial y 2×5 MiB completos a través del proxy. Regresión Usuarios: 4 pasan; descubrimiento: 13 pasan. Total: 58 pruebas aprobadas. Compilaciones API/web correctas, ocho especificaciones pasan validación documental y diff sin incidencias. |
| Medidas EQ-04/EQ-05/EQ-06 | Autorización local dueño/otro/admin/anónimo, anti autoevaluación, account inactiva, proyección pública, cifrado/tampering, atomicidad y 201/409 concurrentes. Imports sin Nest/pg en dominio, fachadas sin acceso cruzado a tablas. Pantallas de perfil público/editor verificadas a 360 px. No equivale a aceptación global del MVP. |
| Limitaciones y fallos | Mapas externos, D02, Catálogo y OpenAPI pendientes. Validación de archivos por firma/tipo/tamaño no sustituye antivirus/análisis semántico. Operación de claves, copias y limpieza con API apagada se valida en 008. No se publican ofertas ni se modifican roles de Usuarios aquí. |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).

## Evidencia de casos críticos

- Dos altas concurrentes: 201/409 y una sola fila por usuario. Ediciones concurrentes con la misma versión: 200/409; la respuesta ganadora coincide con la fila persistida. Payload con usuarioId/roles/estadoVerificacion se rechaza; cuenta inactiva pierde acceso propio y visibilidad pública.
- Solicitud y adjuntos guardados juntos, una pendiente por proveedor. Bytes en BD no coinciden con el original; GCM rechaza tag alterado. Descarga propia/admin devuelve bytes originales como attachment; anónimo 401 y ajeno 404. Perfil público nunca incluye documentos, hashes, usuarioId ni motivos.
- Otro admin decide; un admin no se revisa a sí mismo. Decisiones concurrentes producen 201/409 y una resolución; trigger de prueba provoca 503 y rollback de estado/versión. Historial conserva perfilEnviado anterior aun tras editar nombre público.
- Limpieza preserva adjuntos de activos y purga contenido/IV/tag de inactivos sin borrar decisiones. Pendiente se cancela y perfil vuelve a no_solicitada. Reactivación permite login nuevo, no recupera adjuntos eliminados. CLI y arranque/periodicidad están implementados; operación y copias aún no se ensayan en VPS.
- Primeras ejecuciones detectaron etiquetas de select con nombres accesibles ambiguos; se corrigieron con label/htmlFor explícitos. El caso 2×5 MiB detectó corte real de Next a 10 MB: buffer elevado a 12 MiB y deadline de carga a 120 s, manteniendo 10 s para JSON. El ensayo de transporte no certifica validez semántica del PDF sintético.

La suite de Proveedores genera capturas locales ignoradas en frontend/test-results: proveedor-editor-360.png, proveedor-publico-360.png y proveedor-verificado-360.png. Las suites posteriores pueden limpiar ese directorio; ejecutar test:proveedores para regenerarlas. La política documental real sigue la elección del usuario; las pruebas no contienen documentación de personas.
