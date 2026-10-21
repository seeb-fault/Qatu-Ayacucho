# Validación y recorrido — Catálogo y publicaciones

## Preparación

No hay aplicación ejecutable todavía. Al implementar, completar aquí los comandos reales del repositorio; no se inventan npm scripts. Preparar entorno aislado con PostgreSQL, migraciones y usuarios de prueba con roles distintos. Nunca usar pagos reales ni archivos personales para la aceptación académica.

## Recorridos

1. US1: dado un proveedor verificado, creo herramienta o servicio con tarifa y recurso; comprobar que se guarda una oferta propia coherente.
2. US2: dado ofertas activas e inactivas, aplico filtros y abro detalle; comprobar que solo se muestran las activas y el precio conserva su unidad.
3. US3: dado una publicación denunciada o revisada, la desactivo con motivo; comprobar que deja de aparecer sin borrar historial de reservas.

## Casos críticos

- Proveedor no verificado y edición ajena rechazados.
- Datos persistidos: filtro tipo/categoría/zona/precio, límite 20 y orden estable sin duplicados.
- Desactivar entre listado/detalle, recurso multiu­nidad y precio inválido.
- EQ-01 y EQ-03 con dataset/condiciones del documento; no reportar cumplimiento antes de medir.

## Registro de resultados

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-01/EQ-03/EQ-04/EQ-06 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).
