# Validación y recorrido — Reservas, contratación y pagos

## Preparación

No hay aplicación ejecutable todavía. Al implementar, completar aquí los comandos reales del repositorio; no se inventan npm scripts. Preparar entorno aislado con PostgreSQL, migraciones y usuarios de prueba con roles distintos. Nunca usar pagos reales ni archivos personales para la aceptación académica.

## Recorridos

1. US1: dado dos solicitudes para el mismo recurso, se aceptan concurrentemente; comprobar que una sola queda aceptada y la otra obtiene conflicto.
2. US2: dado un servicio variable, acepto una versión vigente; comprobar que el pago usa el snapshot aceptado y no un precio del navegador.
3. US3: dado un intento persistido, ocurre timeout o se repite el webhook; comprobar que se consulta/deduplica sin iniciar un cobro adicional por incertidumbre.
4. US4: dado una reserva autorizada, registro inicio o cierre con evidencia; comprobar que se valida transición y se emite evento durable.

## Casos críticos

- EQ-07: 100 pares concurrentes, una aceptación por par y cero bloqueos superpuestos.
- EQ-08: 20 reenvíos, un efecto; monto/moneda incorrectos, falsificación, timeout, pago tardío y claves distintas.
- Carrera entre expiración y pago; límites adyacentes de rango y agenda del mismo proveedor.
- Outbox tras reinicio y canal externo caído; consumidores deduplicados.
- Contrato con doble y después Culqi sandbox real; Yape documentar habilitación o bloqueo.

## Registro de resultados

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-04/EQ-05/EQ-06/EQ-07/EQ-08 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).
