# Contratos — Reservas, contratación y pagos

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Diseño, no API publicada.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| GET | /recursos/:id/disponibilidad | Público | sin identidades ajenas |
| POST | /reservas | Cliente autenticado | oferta/recurso/fechas válidos |
| GET | /reservas | Participante | historial propio |
| GET | /reservas/:id | Participante o admin autorizado | no datos de terceros |
| POST | /reservas/:id/aceptacion | Proveedor propietario | bloqueo y outbox atómicos |
| POST | /reservas/:id/cotizacion | Proveedor propietario | versión de cotización variable |
| POST | /reservas/:id/pagos | Cliente de la reserva | Idempotency-Key obligatorio |
| GET | /reservas/:id/pagos | Participante autorizado | estado persistido |
| POST | /pagos/webhooks/culqi | Pasarela verificada | sin JWT de usuario; verificación externa |
| POST | /reservas/:id/cancelacion | Participante autorizado | política y ajuste |
| POST | /reservas/:id/entrega | Participante autorizado | transición y evidencia |
| POST | /reservas/:id/devolucion | Participante autorizado | transición y evidencia |

## Extensiones propuestas para cubrir requisitos existentes

- POST /reservas/:id/cotizacion/aceptacion para aceptación explícita de versión por cliente.
- POST /reservas/:id/rechazo para respuesta del proveedor.
- Gestión de indisponibilidad manual del proveedor: contrato pendiente, misma autoridad de bloqueos.
- Consulta autorizada de avisos/estado de entrega de notificaciones; canal externo por adapter.

Estas extensiones aún no están congeladas: completar DTO/estados en OpenAPI y actualizar docs antes de implementar. No se ejecutan operaciones ni llamadas externas desde estas especificaciones.

## Datos de entrada/salida propuestos

Solicitar: publicacionId, recursoId, inicio, fin y descripcionTrabajo para oficio; no confiar en clienteId ni importe recibido. Respuesta: id, estado, rango, snapshot público y venceEn si existe.

Cotizar: reservaId por ruta, alcance, desglose y vigencia; el servidor asigna versión. Aceptación de cotización: cotizacionId/version y control de vigencia/actor. Aceptar reserva: versión esperada y datos ya acordados; resultado incluye estado ACEPTADA y vencimiento, nunca CONFIRMADA antes de pago verificado.

Pago: token del proveedor y operación autorizada; Idempotency-Key obligatorio. El importe se toma del snapshot en servidor. Respuesta con intentoId, estado y ruta de consulta; 202 si pendiente/desconocido. Webhook usa identificadores externos y verificación soportada por proveedor; no fijar firma ficticia antes de D08. Tokens no se persisten como información reutilizable ni se registran.

Disponibilidad: inicio/fin para recursoId; respuesta de franjas sin identidad de ocupantes. Entrega/devolución: hito, versión esperada y referencias de evidencia privada autorizadas; el acoplamiento con Reputación se resuelve mediante evento/fachada de lectura en el sentido permitido, sin ciclo Reservas→Reputación. Registrar evidencia e hito con coherencia/reintento según el protocolo fijado antes de RF18/RF19; no simular una transacción SQL entre módulos por lecturas directas.

## Puerto interno

ConsultaDisponibilidad y ConsultaReservas; eventos de estado por outbox; ProcesadorPagos y Notificador como puertos internos.

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
