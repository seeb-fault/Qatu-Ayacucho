# Contratos — Reservas, contratación y pagos

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Diseño, no API publicada.

## Incremento 005.1 — Solicitudes sin aceptación comercial

Contrato de implementación para HU03/HU04 y la parte no bloqueante de US1. El resto de las rutas de este documento continúa como diseño pendiente. No se implementan aceptación, bloqueo, cotización, cobro ni cancelación con efectos económicos mientras D05–D08 estén abiertas.

| Método | Ruta | Entrada y permisos |
|---|---|---|
| POST | /reservas | Sesión activa. JSON estricto: publicacionId, recursoId, inicio, fin, descripcionTrabajo opcional (obligatoria de 20–1500 caracteres para servicios). Fechas futuras UTC `YYYY-MM-DDTHH:mm:ss[.sss]Z`, intervalo [inicio,fin). Solo oferta pública vigente y unidad activa; no se admite solicitar una oferta propia. |
| GET | /reservas | Sesión activa. `vista=cliente` (predeterminado) o `proveedor`, `page` 1–9999. Devuelve solo participación propia, 20 registros por página, orden creadoEn/id descendente. Una cuenta sin perfil de proveedor obtiene una bandeja recibida vacía. |
| GET | /reservas/:id | Solo cliente o usuario titular del proveedor. Terceros, incluso administradores sin participación, reciben 404. |
| POST | /reservas/:id/rechazo | Solo titular participante. JSON estricto `{versionActual,motivo}`; versión entera positiva y motivo de 10–500 caracteres. Únicamente PENDIENTE → RECHAZADA. Una respuesta concurrente o versión antigua devuelve 409. |

La respuesta incluye id, proveedorId, publicacionId, recursoId, inicio, fin, descripcionTrabajo, snapshot, estado, motivoRechazo, version, creadoEn y participacion (cliente/proveedor). No expone los IDs de cuentas. El snapshot conserva título, tipo, nombre público del proveedor, identificador de unidad y tarifa/unidad de referencia consultados en servidor; **no constituye cotización ni total aceptado**. Solicitudes y eventos mínimos se guardan en una sola transacción; los eventos permanecen pendientes, sin afirmar envío externo. PENDIENTE no bloquea recursos. No existe estado CONFIRMADA en este incremento.

La misma cuenta no puede tener dos solicitudes PENDIENTE para el mismo recurso e intervalo exacto (409); solicitudes de clientes distintos o intervalos parcialmente coincidentes sí se permiten porque no son bloqueos. Los campos clienteId, propietarioId, estado, importe y snapshot enviados por el navegador se rechazan (400). CSRF y sesión siguen el mecanismo de 002. Proveedores expone titularidad solo por fachada interna; Reservas no consulta sus tablas.

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
