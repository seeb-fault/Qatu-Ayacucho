# Validación y recorrido — Reservas, contratación y pagos

## Preparación

El incremento 005.1 tiene API y web ejecutables para solicitar, consultar y rechazar. Preparar PostgreSQL y configurar backend/.env como indica backend/README.md. Ejecutar `npm run migrate` desde backend; iniciar `npm run dev` en backend y frontend. Abrir `/reservas`, o elegir una oferta pública y pulsar «Solicitar reserva». Las operaciones completas de los recorridos siguientes siguen pendientes.

Para pruebas usar exclusivamente una base con sufijo `_test`; definir DATABASE_URL y TEST_DATABASE_URL para esa base, JWT_SECRET de pruebas (mínimo 32 caracteres) y DOCUMENTOS_KEY de pruebas (64 caracteres hexadecimales). No usar una base de desarrollo con cuentas personales.

1. Desde backend: `npm run migrate`, `npm run build` y `npm test`.
2. Desde frontend: `npm run build`, `npm run typecheck` y `npm run test:reservas`.
3. Puertos 3001/3100 libres para las E2E, ejecutadas secuencialmente con las otras suites. El fixture sintético exige `QATU_E2E_RESERVAS=1` y sufijo `_test`, y crea sus propias cuentas/oferta sin borrar datos. La aprobación del proveedor se prepara directamente en el fixture aislado; no es evidencia del recorrido documental, cubierto por 003/004.

La prueba comprueba solicitud de cliente, conversión explícita de hora de Lima a UTC, bandeja recibida del proveedor, rechazo con motivo, lectura del estado persistido por cliente y ancho móvil de 360 px. El backend verifica aislamiento, origen/sesión, entrada manipulada, recursos inactivos/ajenos, duplicados concurrentes, snapshot, rechazo concurrente y rollback si falla outbox. No acredita EQ-07 de aceptación ni EQ-08 de pagos.

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

### Validación local del incremento 005.1 (2026-10-27)

- Node.js 24.21.0, Windows, Chrome instalado y PostgreSQL/PostGIS 17/3.5 en Docker local; base exclusiva `qatu_reservas_test` en puerto 5433. Fixture sintético sin pagos ni documentos personales.
- `npm run migrate` y `npm run build` en backend: correctos. La primera ejecución completa de `npm test` aprobó 61 pruebas sin omisiones. Tras añadir el fallo transaccional de outbox y corregir una suposición del fixture sobre el orden aleatorio de UUID de recursos, las 11 pruebas específicas de Reservas aprobaron sin omisiones (incluyen el nuevo caso).
- Frontend: `npm run build` y `npm run typecheck` correctos; `npm run test:reservas`: 1 recorrido E2E aprobado (59.3 s con arranque/cierre). La prueba incluye vista móvil de 360 px y captura en `frontend/test-results/reservas-recibidas-360.png` (artefacto local ignorado por Git).
- Regresión de navegación/detalle: `QATU_TEST_PORT=3200 npm test -- --output=test-results/descubrimiento`, 13 pruebas aprobadas (1.0 min). La variable se configura con sintaxis de entorno de PowerShell en Windows.
- Detector CI: 11 pruebas aprobadas. El manifiesto declara `ultimaEntrega=004` e `incrementos=["005.1"]`; exige los archivos de Reservas y activa el recorrido nuevo. Las bases remotas de CI son efímeras; no se usan los datos locales.
- La tarifa de referencia permanece inmutable aunque cambie el precio de la oferta. La creación duplicada y el rechazo concurrente generan un solo efecto; un fallo de outbox revierte estado y versión. Son verificaciones del incremento; no constituyen EQ-07 de aceptación ni EQ-08 de pagos.
- Commit y ejecución remota: se registran por los commits/PR de este incremento; la evidencia local no sustituye el CI remoto. Revisión humana, aceptación comercial, bloqueo de recursos, cotizaciones, checkout, vencimiento, notificaciones externas y ciclo de entrega/devolución siguen pendientes.

La tabla siguiente conserva los pendientes de aceptación del módulo completo, no los del incremento 005.1.

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | Pendiente |
| Fixture y condiciones | Pendiente |
| Comandos ejecutados | Pendiente |
| Resultados positivos/negativos | Pendiente |
| Medidas EQ-04/EQ-05/EQ-06/EQ-07/EQ-08 | Pendiente |
| Limitaciones y fallos | Pendiente |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).
