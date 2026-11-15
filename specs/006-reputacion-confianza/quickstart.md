# Validación y recorrido — Reputación y confianza

## Preparación

No hay aplicación ejecutable todavía. Al implementar, completar aquí los comandos reales del repositorio; no se inventan npm scripts. Preparar entorno aislado con PostgreSQL, migraciones y usuarios de prueba con roles distintos. Nunca usar pagos reales ni archivos personales para la aceptación académica.

## Recorridos

1. US1: dado mi reserva en etapa permitida, subo evidencia válida; comprobar que se guarda privada con metadata y solo los autorizados la descargan.
2. US2: dado mi reserva finalizada sin reseña previa, califico de 1 a 5; comprobar que se registra una reseña única y se actualiza la reputación publicada.
3. US3: dado un acuerdo de garantía, reporto incidencia; comprobar que se conserva historial para revisión humana sin simular custodia.

## Casos críticos

- Reseña ajena/anticipada/duplicada y puntuación inválida rechazadas; duplicado concurrente único.
- Descargas de evidencia ajena y archivos inválidos rechazados; hashes y referencias verificables.
- Moderación conserva auditoría y recalcula agregados sin reseñas ocultas.
- Restaurar archivos junto con metadata conforme a EQ-09.

## Registro de resultados

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-04/EQ-05/EQ-09 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).

## Validación local del incremento 006.1 — reseñas (2026-11-11)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS local en Docker, bases nuevas con sufijo `_test` y variables en el proceso. No se modificó `.env`.
- Backend: `npm test` aprobó 153 pruebas sin omisiones. Las 10 de `test/resenas/resenas.test.ts` cubren entrada y plazo de 14 días en dominio, límites entre módulos y, con PostgreSQL real: reserva sin cerrar (409), proveedor (403), tercero (404), anónimo (401), entrada inválida (400), dos envíos simultáneos con una sola reseña, vista pública sin cliente ni reserva, plazo vencido (409) y moderación auditada que recalcula el promedio.
- Navegador: `test:resenas` aprobó el recorrido: devolución real, reseña con validación, vista del proveedor sin formulario, perfil público, tarjeta del catálogo y perfil sin desborde a 360 px. `test:catalogo` 2, `test:proveedores` 6 y `npm test` 14 aprobadas.
- En la ejecución secuencial de todas las suites fallaron una vez `efectivo.spec.ts` (alquiler con efectivo) y el recorrido de oficio de `pagos.spec.ts`; repetidos dos veces por separado aprobaron siempre (2 y 1). Se registra como inestabilidad por tiempo, sin causa confirmada; cada reserva cerrada hace ahora una consulta adicional de reseña.
- Pendientes de 006: evidencias (006.2), garantía documental e incidencias (006.3), restauración EQ-09.

## Validación local del incremento 006.2 — evidencias (2026-11-11)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS local en Docker, bases nuevas con sufijo `_test`; `DOCUMENTOS_KEY` aleatoria en el proceso. No se modificó `.env`.
- Backend: `npm test` aprobó 160 pruebas sin omisiones. `test/resenas/evidencias.test.ts` cubre las etapas en dominio y, con PostgreSQL real: etapa cerrada (409), tercero (404), anónimo (401), PDF disfrazado y PDF real (400), etapa desconocida (400), cupo de 4 por etapa (409), descarga `attachment` con `CSP sandbox` y bytes idénticos para cliente, proveedor y administrador, contenido cifrado en la base, y retención: a los 90 días del cierre se borra el contenido, se conserva el hash y la descarga responde 410.
- El cifrado de los documentos de verificación pasó a `shared/infraestructura/archivos-cifrados.ts` sin cambiar su comportamiento: `verificacion.test.ts` aprobó 9 de 9. Su prueba de conservación lanzaba el script de limpieza con `execFileSync`, que bloqueaba el servidor de la prueba y producía `ECONNRESET` (ya registrado en 005); ahora usa `execFile` asíncrono y aprobó tres repeticiones.
- Navegador: `test:resenas` 2 (reseñas y evidencias: PDF rechazado, foto subida y descargada intacta, visible para el proveedor, 401 sin sesión, sin desborde a 360 px), `test:reservas` 8, `test:pagos` 2, `test:proveedores` 6, `test:catalogo` 2 y `npm test` 14, todas aprobadas.
- Pendientes de 006: garantía documental e incidencias (006.3), que además deben retener evidencias con incidencia abierta, y la restauración EQ-09.

## Validación local del incremento 006.3 — incidencias y garantía documental (2026-11-12)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS local en Docker, bases nuevas con sufijo `_test`; `DOCUMENTOS_KEY` aleatoria en el proceso. No se modificó `.env`.
- Backend: `npm test` aprobó 167 pruebas sin omisiones. `test/resenas/incidencias.test.ts` cubre el plazo y la validación en dominio y, con PostgreSQL real: garantía solo del proveedor antes de entregar, sin montos, con versión; conformidad del cliente solo al recibir y con la versión vigente; acuerdo fijo tras la conformidad; tercero 404; dos reclamos simultáneos dejan uno abierto; dos resoluciones simultáneas dejan una; resolución solo por un admin ajeno y sin cambios en el pago; fotos de la incidencia visibles para el admin (403 al cliente); retención de fotos con incidencia abierta y borrado tras resolverla; reclamo fuera de plazo (409).
- Navegador: `test:resenas` 3 (reseñas, evidencias, y garantía con reclamo y resolución por un admin ajeno, sin desborde a 360 px), `test:reservas` 8, `test:pagos` 2, `test:proveedores` 6, `test:catalogo` 2 y `npm test` 14, todas aprobadas.
- Pendientes de 006: avisos de apertura y resolución de incidencias, y la restauración EQ-09.
