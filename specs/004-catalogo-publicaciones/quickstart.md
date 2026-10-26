# Validación y recorrido — Catálogo y publicaciones

## Entorno y versión

Validación local del 2026-10-26, Windows, PowerShell, Node.js 24.21.0, PostgreSQL/PostGIS del contenedor `qatu-local-db-1` (puerto 5433). Base exclusiva `qatu_catalogo_test`; datos sintéticos y PNG mínimo, sin documentos personales. Código implementado en 73ba16b (nueve commits sobre 94584b7); evidencias y documentación de cierre en el décimo commit. Los resultados locales y remotos se distinguen a continuación; no constituyen aceptación global en VPS.

## Preparación y comandos reales

1. Instalar dependencias de backend/frontend (`npm ci` en cada carpeta).
2. Configurar DATABASE_URL para una base exclusiva y ejecutar `npm run migrate` desde backend. La migración se ejecutó dos veces y fue idempotente.
3. Para HTTP/integración, TEST_DATABASE_URL debe señalar esa misma base exclusiva. `npm test` desde backend; sin esa variable las integraciones se omiten.
4. Para E2E, configurar DATABASE_URL, JWT_SECRET y DOCUMENTOS_KEY de pruebas, migrar la base y ejecutar `npm run build` en frontend. Los secretos son efímeros, no se guardan en este documento.
5. Desde frontend: `npm test`, `npm run test:acceso`, `npm run test:usuarios`, `npm run test:proveedores`, `npm run test:catalogo`, secuencialmente por los puertos compartidos. Acceso usa respuestas API simuladas; usuarios/proveedores/catálogo usan API y PostgreSQL reales.

El catálogo persistido es predeterminado. `QATU_CATALOGO=demo` habilita expresamente fixtures solo en el servidor; las pruebas de descubrimiento configuran esa variable sin cambiar las demás suites. La API no se sustituye silenciosamente por fixtures cuando falla: la UI muestra error o vacío según corresponda.

## Resultados ejecutados

| Comprobación | Resultado |
|---|---|
| Backend `npm run build` | PASS |
| Frontend `npm run build` y `npm run typecheck` | PASS |
| Migración repetida | PASS; no borra datos ni reaplica SQL |
| Suite backend completa en CI con PostgreSQL | 51 PASS, 0 omitidas, en la ejecución 40279853296 |
| Pruebas específicas tras optimizar la consulta (`dominio`, `persistencia`, `carga-seguridad`) | 16 PASS locales; incluye página de 20, concurrencia y seguridad del runner |
| Nuevas E2E de catálogo | 2 PASS; API compilada, documentos cifrados, verificación y base reales |
| Detector de entregas | 8 PASS, incluyendo 004 y rechazo sin migración |
| Prerequisitos Spec Kit | 8 carpetas PASS; 8 artefactos por entrega |
| Regresiones descubrimiento / acceso / usuarios | 13 / 3 / 4 PASS |
| Regresión proveedores | 6 PASS usando backend compilado y base qatu_catalogo_e2e_test |
| Imports y whitespace | Dominio puro; Catálogo sin repositorios/SQL de otros módulos; git diff --check PASS |

## Recorridos demostrados

- US1: cuenta → perfil → solicitud documental sintética → revisión administrativa → publicar herramienta con dos recursos → recargar → editar conservando IDs → desactivar/reactivar. Servicio a cotizar conserva null, sin total inventado.
- US2: buscar por texto sin tildes y filtros AND, comprobar precio en céntimos y unidad, detalle, página predeterminada de 20 y segunda página sin duplicados. La consulta pública omite privados y excluye perfiles ocultos, no aprobados o con cuenta inactiva.
- US3: cliente rechazado; admin retira con motivo, deja de ser pública, dueño no puede reactivarla, historial registra la decisión; admin levanta retirada. No se borran recursos ni historial.
- Concurrencia: dos ediciones con la misma versión producen un 200 y un 409. PostgreSQL rechaza tarifa incompatible y oferta activa sin recursos activos, incluso mediante SQL directo en la base de pruebas.
- Interfaz de publicación comprobada a 360 px, sin desbordes; captura `frontend/test-results/catalogo-editor-360.png` (artefacto generado, no documento personal).

## Límites de aceptación

El ensayo local de Catálogo sí ejecutó cinco minutos de calentamiento y quince medidos, con 100 proveedores y 1000 publicaciones, y fue aprobado. El escenario global EQ-01/EQ-03 permanece pendiente: exige además 5000 reservas y mezcla 70/20/10; Reservas todavía no está implementado. Resultados y alcance en cierre.md. No se sustituye ese ensayo por los tiempos de tests funcionales. EQ-04 tiene evidencia de los escenarios de permisos descritos; no es una auditoría exhaustiva. EQ-06 tiene verificaciones de teclado/desbordes existentes; no se declara usabilidad completa sin su ensayo.

D02, mapas externos, reservas, pagos, fotos subidas por usuarios y búsqueda IA siguen fuera de esta entrega. Las imágenes de oferta son ilustraciones locales identificadas como referencia; testimonios de la home son ficticios. La Spec 004 queda implementada funcionalmente, con aceptación global de calidad pendiente.

Al repetir suites sobre la misma base de pruebas pueden acumularse las cuotas de registro por IP y producir 429. La validación se repitió limpiando solo limites_acceso en qatu_catalogo_test; la cuota de la aplicación no se cambia. La prueba de registro espera y comprueba el 201 de la API antes de verificar la URL, sin introducir pausas fijas.

Las suites E2E con API usan el backend compilado (npm run start). Ejecutar npm run build en backend antes de iniciarlas; el CI lo hace explícitamente. Esto comprueba el mismo artefacto JavaScript del arranque normal y evita recompilación de TypeScript al levantar cada suite.

CI remoto del código 73ba16b: https://github.com/seeb-fault/Qatu-Ayacucho/actions/runs/40279853296 — especificaciones, backend/PostgreSQL y frontend aprobados. El CI incluye 51 pruebas backend, 28 E2E y 8 del detector de entrega; no se mezclan dobles de acceso con las integraciones reales de usuarios/proveedores/catálogo.
