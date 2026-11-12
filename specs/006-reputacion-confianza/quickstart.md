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
