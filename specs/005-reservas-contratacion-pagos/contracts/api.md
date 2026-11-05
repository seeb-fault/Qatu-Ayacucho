# Contratos — Reservas, contratación y pagos

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Incrementos 005.1–005.4: herramientas, efectivo, propuestas y agenda de oficios. Las rutas futuras se identifican como diseño pendiente.

## Incremento 005.1 — Solicitudes sin aceptación comercial

Contrato inicial para HU03/HU04 y la parte no bloqueante de US1. Los incrementos posteriores amplían este subconjunto como se indica abajo; las rutas de pasarela y los efectos comerciales aún sin decisión continúan pendientes.

| Método | Ruta | Entrada y permisos |
|---|---|---|
| POST | /reservas | Sesión activa. JSON estricto: publicacionId, recursoId, inicio, fin, descripcionTrabajo opcional (obligatoria de 20–1500 caracteres para servicios). Fechas futuras UTC `YYYY-MM-DDTHH:mm:ss[.sss]Z`, intervalo [inicio,fin). Solo oferta pública vigente y unidad activa; no se admite solicitar una oferta propia. |
| GET | /reservas | Sesión activa. `vista=cliente` (predeterminado) o `proveedor`, `page` 1–9999. Devuelve solo participación propia, 20 registros por página, orden creadoEn/id descendente. Una cuenta sin perfil de proveedor obtiene una bandeja recibida vacía. |
| GET | /reservas/:id | Solo cliente o usuario titular del proveedor. Terceros, incluso administradores sin participación, reciben 404. |
| POST | /reservas/:id/rechazo | Solo titular participante. JSON estricto `{versionActual,motivo}`; versión entera positiva y motivo de 10–500 caracteres. Únicamente PENDIENTE → RECHAZADA. Una respuesta concurrente o versión antigua devuelve 409. |

La respuesta incluye id, proveedorId, publicacionId, recursoId, inicio, fin, descripcionTrabajo, snapshot, estado, motivoRechazo, version, creadoEn y participacion (cliente/proveedor). No expone los IDs de cuentas. El snapshot conserva título, tipo, nombre público del proveedor, identificador de unidad y tarifa/unidad de referencia consultados en servidor; **no constituye cotización ni total aceptado**. Solicitudes y eventos mínimos se guardan en una sola transacción; los eventos permanecen pendientes, sin afirmar envío externo. PENDIENTE no bloquea recursos. No existe estado CONFIRMADA en este incremento.

La misma cuenta no puede tener dos solicitudes PENDIENTE para el mismo recurso e intervalo exacto (409); solicitudes de clientes distintos o intervalos parcialmente coincidentes sí se permiten porque no son bloqueos. Los campos clienteId, propietarioId, estado, importe y snapshot enviados por el navegador se rechazan (400). CSRF y sesión siguen el mecanismo de 002. Proveedores expone titularidad solo por fachada interna; Reservas no consulta sus tablas.

### Incremento 005.2 — Herramientas, apartado y efectivo (acuerdo 2026-10-27)

`POST /reservas` admite además `tipoSolicitud` (`alquiler` predeterminado, `visita`), `aceptaCondiciones` y `tarifaEsperadaCentimos` (true y tarifa entera positiva obligatorios para nuevos alquileres de herramientas). La tarifa esperada se compara con Catálogo; no determina el precio servidor. Las nuevas solicitudes de alquiler de herramientas conservan condiciones comerciales calculadas en servidor; visitas y servicios no reciben condiciones de alquiler. Las antiguas sin condiciones pueden consultarse/rechazarse, pero requieren nueva solicitud para aceptar.

Todas las mutaciones siguientes son POST de participante autenticado, JSON estricto con `versionActual` positiva. Estados/versiones caducados producen 409; terceros reciben 404. Cada mutación y evento se guardan atómicamente; ningún endpoint recibe importes ni fechas de efectivo/devolución del navegador.

| Sufijo de /reservas/:id | Actor / entrada adicional | Efecto |
|---|---|---|
| /aceptacion | Proveedor; sin campos adicionales | Solo alquiler de herramienta con condiciones vigentes: PENDIENTE → ACEPTADA, exclusión GiST recurso/rango y vencimiento en 60 min. |
| /visita | Proveedor; `motivo` 10–500 | PENDIENTE de visita → VISITA_ACORDADA, sin bloqueo ni cobro. |
| /ampliacion | Proveedor; `motivo` 10–500 | Renueva apartado aún vigente a 60 min desde ahora, sin superar fin. |
| /cancelacion | Cliente o proveedor; `motivo` 10–500 | PENDIENTE, VISITA_ACORDADA o ACEPTADA vigente → CANCELADA; libera bloqueo si existe. No admite estados con efectivo registrado. |
| /efectivo | Proveedor; sin campos adicionales | ACEPTADA vigente → ENTREGA_POR_CONFIRMAR; registra efectivo pactado y entrega declarada, sin confirmar por cliente. |
| /recepcion | Cliente; sin campos adicionales | Confirma pago/recepción: ENTREGA_POR_CONFIRMAR → EN_CURSO. |
| /devolucion/aviso | Cliente; sin campos adicionales | EN_CURSO → DEVOLUCION_PENDIENTE; hora reportada asignada por servidor. |
| /devolucion/confirmacion | Proveedor; sin campos adicionales | DEVOLUCION_PENDIENTE → DEVUELTA; confirma hora informada, calcula días extra/importe final y saldo, libera recurso. |
| /devolucion/rechazo | Proveedor; `motivo` 10–500 | Rechaza aviso con motivo, vuelve a EN_CURSO conservando historial. |

La consulta participante agrega tipoSolicitud, condiciones (versión de política, tarifa/días/importe pactado, tolerancia), venceEn, pagoEstado, efectivoCentimos, entregadoEn, recibidoEn, devolucionInformadaEn, devueltoEn, importeFinalCentimos, saldoCentimos y motivoOperacion. Las visitas y servicios no reciben un total de alquiler ficticio. `GET /recursos/:id/disponibilidad?publicacionId=<uuid>&inicio=<UTC>&fin=<UTC>` valida publicación/unidad pública por Catálogo y devuelve rangos ocupados sin identidades y si existe posesión física; no promete disponibilidad futura ante retrasos. El vencimiento se procesa periódicamente y antes de aceptar/mutar/consultar, con bloqueo transaccional. No hay pasarela ni consumidor externo.

### Incremento 005.3 — Cotizaciones versionadas de oficios

El comportamiento original descrito en esta sección se amplía por 005.4, documentado abajo: las nuevas aceptaciones reservan agenda; los acuerdos históricos conservan confirmación expresa.

Para solicitudes `PENDIENTE` de tipo `alquiler` cuya oferta sea un `servicio`, el proveedor participante puede proponer un alcance y un total en PEN. No se cotizan visitas ni herramientas. La aceptación registra el acuerdo económico; no cambia la solicitud a ACEPTADA, no bloquea agenda ni exige/registra anticipo. La web muestra «Cotización acordada; agenda por coordinar». Pasarela y reserva operativa de oficios continúan pendientes de D06–D08.

| Sufijo de /reservas/:id | Actor / JSON estricto | Efecto |
|---|---|---|
| /cotizacion | Proveedor; `versionActual`, `alcance` 20–1500, `materiales` 10–1000, `importeCentimos` entero 1–99999999, `vigenteHasta` UTC futura y no posterior a inicio | Crea versión consecutiva inmutable, incrementa versión de solicitud y registra evento. Hasta 50 versiones por solicitud. |
| /cotizacion/aceptacion | Cliente; `versionActual`, `versionCotizacion` enteras positivas | Acepta solo la última propuesta sin respuesta y vigente; conserva su precio servidor y bloquea nuevas propuestas. |
| /cotizacion/rechazo | Cliente; `versionActual`, `versionCotizacion`, `motivo` 10–500 | Rechaza solo la última propuesta vigente, conservando motivo; permite al proveedor crear otra versión. |

Las tres operaciones responden con la solicitud actualizada y `cotizaciones` ordenadas por versión: alcance, materiales, importeCentimos, moneda, vigenteHasta, creadaEn y respuesta (decision, motivo, respondidaEn) o null. Los IDs de cuentas no se exponen. Terceros reciben 404; actor participante incorrecto, 403; entrada inválida, 400; versión antigua, propuesta sustituida, respondida/vencida o solicitud no habilitada, 409. No se admiten importes del cliente en aceptación/rechazo. El inicio debe seguir siendo futuro al publicar o responder.

Reserva, respuesta y evento se guardan en una transacción bajo bloqueo de la solicitud; una carrera de respuesta tiene un solo efecto. Publicar una nueva versión no modifica la anterior: una propuesta sin respuesta anterior queda sustituida. Una propuesta aceptada no se reescribe ni se convierte en rechazo de solicitud; la cancelación sin dinero conserva el acuerdo histórico y cancela únicamente la solicitud. La consulta de disponibilidad sigue mostrando solo bloqueos efectivos, no acuerdos económicos sin agenda.

### Incremento 005.4 — Agenda de oficios sin anticipo

Este incremento amplía el comportamiento de aceptación de 005.3: `POST /reservas/:id/cotizacion/aceptacion` acepta la última propuesta vigente y reserva su horario en la misma transacción. La solicitud pasa a `SERVICIO_CONFIRMADO`; se conserva `pagoEstado=PENDIENTE`, cero efectivo y `venceEn=null`. No utiliza el apartado de herramientas de 60 min ni representa servicio ejecutado. Oferta pública vigente y recurso activo se comprueban por fachada antes de confirmar.

La exclusión se aplica al recurso/agenda seleccionado y al intervalo exacto [inicio,fin). Dos aceptaciones para horarios solapados tienen un solo éxito; el otro participante recibe 409 `RECURSO_OCUPADO` sin respuesta de cotización, bloqueo, cambio de versión ni eventos parciales. Horarios adyacentes se permiten. La disponibilidad pública muestra solo los rangos, sin identidades.

Para acuerdos aceptados antes de 005.4 que siguen PENDIENTE, `POST /reservas/:id/agenda/confirmacion` permite al cliente confirmar explícitamente el horario con JSON estricto `{versionActual,versionCotizacion}`. La versión indicada debe estar aceptada, el inicio seguir futuro y la agenda disponible. No se reescribe el acuerdo ni se exige que su vigencia original siga abierta: ya fue aceptado válidamente. Terceros reciben 404; proveedor, 403; campos extra, 400; versión antigua, falta de acuerdo, horario ocupado o agenda ya confirmada, 409. Las nuevas aceptaciones no necesitan este segundo paso.

`POST /reservas/:id/cancelacion` admite también SERVICIO_CONFIRMADO antes del inicio, para cualquiera de los participantes con versión y motivo. Libera el bloqueo en transacción conservando la aceptación y el precio. Después del inicio devuelve 409: el cierre operativo del oficio sigue pendiente. La confirmación emite AGENDA_CONFIRMADA, además de COTIZACION_ACEPTADA cuando corresponde, mediante outbox; no afirma notificación externa ni pago.

## Rutas tomadas del diseño vigente — alcance futuro

La tabla conserva el diseño completo. Las rutas de pagos, hitos con evidencia y acceso administrativo no amplían los permisos ni reemplazan los endpoints de 005.1/005.2/005.3 implementados arriba.

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

- POST /reservas/:id/cotizacion/aceptacion: concretado en 005.3 para acuerdo económico, sin agenda ni cobro.
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
