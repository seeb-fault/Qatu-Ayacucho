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

## Validación local de los avisos de incidencias (2026-11-12)

- Entorno: el mismo, con bases nuevas `_test`. No se modificó `.env`.
- Backend: `test/resenas/*`, `test/reservas/avisos.test.ts` y `test/reservas/despacho.test.ts` aprobaron 47 de 47. Cubren los destinatarios (reporte del cliente al proveedor, del proveedor al cliente, resolución a ambos), un solo evento `INCIDENCIA_ABIERTA` tras dos reclamos simultáneos y un solo `INCIDENCIA_RESUELTA` con el administrador como actor.
- La migración `reservas/010-eventos-incidencias` se aplicó, se revirtió y se volvió a aplicar sin errores.
- Pendiente de 006: la restauración EQ-09.

## Restauración EQ-09 (2026-11-12)

- `test/resenas/restauracion.test.ts` (PostgreSQL real) aprobó 5 de 5: base íntegra sin problemas nuevos y con la evidencia y el pago en el historial; la verificación no cambia la base (misma huella); con otra clave o sin `DOCUMENTOS_KEY` los archivos se reportan ilegibles; un byte alterado en una foto, una migración borrada y un pago perdido se detectan y cambian la huella.
- `test/proveedores/verificacion.test.ts` usa la `DOCUMENTOS_KEY` del entorno si existe, para que una base compartida quede legible con una sola clave; sin ella, mantiene su clave aleatoria.
- Simulacro local en Docker (PostgreSQL 17.5 con PostGIS): se pobló una base `_test` con la suite del backend (173 de 173), se copió con `pg_dump -Fc` (199 372 bytes) y se restauró con `pg_restore --exit-on-error` en una base vacía. Copia y restauración tardaron 8,9 s.
  - Origen y restaurada: `Restauración verificada.`, la misma huella y las mismas filas en 17 tablas (291 reservas, 14 pagos, 567 eventos, 7 evidencias y 4 documentos).
  - Archivos vigentes: 1 evidencia y 2 documentos descifrados y con su hash correcto; 6 evidencias y 2 documentos ya retirados por retención, con su metadata y su hash.
  - Pagos: 12 aprobados, 1 rechazado y 1 en proceso (queda para el conciliador), con 8 reembolsos pendientes.
  - Con otra clave, los 3 archivos vigentes se reportan ilegibles.
- Navegador: `test:resenas` 3 y `test:reservas` 8 aprobadas. Una corrida de `test:resenas` falló al inicio porque el servidor web aún no aceptaba conexiones (`ERR_CONNECTION_REFUSED`); las dos repeticiones aprobaron 3 de 3.
- Pendiente fuera de 006: las copias diarias cifradas fuera del VPS y la medición de RPO y RTO (008), y la conciliación con la pasarela de los cobros posteriores a la copia (fase de pagos).

### Procedimiento

1. Copia: `pg_dump -Fc -d <base> -f qatu.dump`. Respaldar `DOCUMENTOS_KEY` aparte.
2. En un entorno vacío: `createdb`, `CREATE EXTENSION postgis` y `pg_restore --no-owner --exit-on-error -d <base> qatu.dump`.
3. Con `DATABASE_URL` y `DOCUMENTOS_KEY` de origen: `npm run restauracion:verificar`, que debe terminar en `Restauración verificada.`. Comparar su huella con la del origen.
