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
