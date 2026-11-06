# Plan técnico — Reservas, contratación y pagos

**Estado:** 005.1/005.2 implementados y verificados localmente. Solicitudes, bandejas, rechazo, visita, apartado de herramientas, efectivo bilateral y devolución disponibles. 005.3 incorpora cotizaciones; 005.4 confirma la agenda al aceptar sin anticipo; 005.5 agrega ejecución y cierre de oficios con efectivo bilateral; 005.6/005.7, despacho de eventos y avisos dentro de la app; 005.8, pago en línea solo en modo de prueba. Sandbox real, 3DS, producción, canales externos y disputas conservan sus decisiones e integración pendientes.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: reservas; bloqueos; intentos_pago; eventos_pasarela; outbox_eventos; cotizaciones y sus versiones (extensión propuesta para RF23). No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo reservas, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código en backend/src/modules/reservas/{dominio,aplicacion,infraestructura,presentacion}; composición en reservas.module.ts y fachada en index.ts. Pantallas en frontend/src/app/reservas y componentes en frontend/src/components/reservas. Migraciones propias bajo backend/migrations/reservas; pruebas de dominio e integración bajo backend/test/reservas. Las rutas de 005.1/005.2/005.3 se distinguen del diseño futuro en contracts/api.md.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

ConsultaDisponibilidad y ConsultaReservas; eventos de estado por outbox; ProcesadorPagos y Notificador como puertos internos.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

005.1 implementa solicitud y consulta propia/rechazo; 005.2 agrega las condiciones comerciales de herramientas autorizadas en research.md, bloqueo GiST, vencimiento, efectivo bilateral y devolución. El snapshot de referencia se conserva; las nuevas condiciones aceptadas son un registro independiente e inmutable calculado por servidor. El manifiesto mantiene ultimaEntrega=004 e incrementos=[005.1,005.2] para ejecutar sus pruebas sin declarar completa 005. Los pasos afectados por las partes pendientes de D06–D08/D12 conservan sus bloqueos.

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

- D05 resuelta para herramientas fijas por bloques de 24 h; tarifa y condiciones inmutables implementadas.
- D06 parcial: herramientas con apartado de 60 min y visitas sin bloqueo implementadas; 005.3/005.4 permiten acordar cotizaciones con vigencia y confirmar agenda sin anticipo; 005.5 cubre ejecución y cierre con efectivo. Anticipos y disputas pendientes.
- D07 parcial: efectivo directo sin comisión y cancelación previa al registro implementados; checkout externo, reembolsos y pago tardío pendientes.
- D08: credenciales, método de verificación y capacidades vigentes Culqi/Yape/mensajería; bloquea integración real.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).

## Seguimiento transversal tras 004

El escenario global EQ-01/EQ-03 incorpora 5000 reservas y una mezcla 70% búsquedas, 20% detalle y 10% consultas de reservas. El ensayo local de 004 mide solo Catálogo con 100 proveedores/1000 publicaciones y mezcla 70/30; no acredita ese escenario global. Al implementar Reservas se incorporará su tráfico real y el conjunto de datos correspondiente. Los resultados en VPS y la aceptación global se registrarán en 008. No se crean reservas ficticias ni se marcan estas comprobaciones como aprobadas por pasar el ensayo local de Catálogo.
