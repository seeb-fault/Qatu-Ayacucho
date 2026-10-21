# Plan técnico — Reservas, contratación y pagos

**Estado:** plan documental; código, migraciones y pruebas aún no ejecutados.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: reservas; bloqueos; intentos_pago; eventos_pasarela; outbox_eventos; cotizaciones y sus versiones (extensión propuesta para RF23). No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo reservas, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código previsto en backend/src/modules/reservas/{dominio,aplicacion,infraestructura,presentacion}; composición en reservas.module.ts y fachada en index.ts. Pantallas en frontend/src/app y componentes en frontend/src/components/reservas. Migraciones propias bajo backend/migrations/reservas; pruebas unitarias junto al dominio e integración bajo backend/test/reservas. Rutas previstas, todavía inexistentes.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

ConsultaDisponibilidad y ConsultaReservas; eventos de estado por outbox; ProcesadorPagos y Notificador como puertos internos.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Resolver D05-D08 y revisar contratos/estados con snapshots.
2. Crear reserva/bloqueos/cotizaciones y exclusión PostgreSQL.
3. Implementar solicitudes, aceptación/rechazo, expiración y calendario.
4. Implementar cotización versionada y aceptación explícita.
5. Implementar intento persistido, adapter Culqi e idempotencia.
6. Implementar webhook verificado, conciliación y pago tardío.
7. Implementar outbox y adapter externo de notificación con reintento.
8. Integrar bandejas, checkout, entrega/devolución y estados separados.
9. Ejecutar EQ-07/EQ-08 y sandbox, guardar evidencias.

## Verification

- EQ-07: 100 pares concurrentes, una aceptación por par y cero bloqueos superpuestos.
- EQ-08: 20 reenvíos, un efecto; monto/moneda incorrectos, falsificación, timeout, pago tardío y claves distintas.
- Carrera entre expiración y pago; límites adyacentes de rango y agenda del mismo proveedor.
- Outbox tras reinicio y canal externo caído; consumidores deduplicados.
- Contrato con doble y después Culqi sandbox real; Yape documentar habilitación o bloqueo.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D05: días calendario o bloques 24 h, retiro/devolución, mínimos y tarifa; bloquea cálculo comercial.
- D06: secuencia cotización/aceptación/bloqueo, vencimiento (15 min propuesto), anticipo y vigencia; bloquea aceptación/cobro de oficio.
- D07: comisión, cancelaciones, reembolsos y pago tardío; bloquea checkout operativo.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
