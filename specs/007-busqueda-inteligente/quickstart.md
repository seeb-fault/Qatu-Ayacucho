# Validación y recorrido — Búsqueda inteligente

## Preparación

No hay aplicación ejecutable todavía. Al implementar, completar aquí los comandos reales del repositorio; no se inventan npm scripts. Preparar entorno aislado con PostgreSQL, migraciones y usuarios de prueba con roles distintos. Nunca usar pagos reales ni archivos personales para la aceptación académica.

## Recorridos

1. US1: dado una consulta explícita de taladro/zona/presupuesto, ejecuto búsqueda; comprobar que veo filtros editables y ofertas con IDs/precios reales.
2. US2: dado una fecha relativa o categoría ambigua, se interpreta la consulta; comprobar que se muestran campos que requieren precisión y prevalecen filtros manuales.
3. US3: dado timeout, cuota o JSON inválido, ejecuto búsqueda; comprobar que recibo modo convencional sin bloquear reservas ni pagos.

## Casos críticos

- EQ-02: 429/5xx/latencia/JSON inválido con reservas/pagos operativos.
- EQ-10: 50 consultas (30 explícitas,10 ambiguas,10 adversariales), fecha fija y etiquetas humanas.
- Meta >=90% filtros exactos explícitos y >=80% pertinente en primeros5; cero IDs/precios inventados/escrituras.
- Proveedor IA sustituible por doble sin modificar dominio; cuotas y límite 500 caracteres.

## Registro de resultados

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-01/EQ-02/EQ-05/EQ-10 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).
