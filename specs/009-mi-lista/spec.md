# 009 — Mi lista

**Estado:** etapa 1 (009.1) implementada y verificada en backend con PostgreSQL real; recorrido de navegador escrito para CI. **Fecha:** 2026-11-14, actualizada 2026-11-15.
**Módulo técnico:** reservas (borradores de solicitud) y usuarios (regreso tras el ingreso). **Historias:** necesidad nueva del cliente, propuesta el 2026-11-14; extiende HU de solicitud de reserva y de cotización.

## Objetivo y alcance

Que el cliente guarde herramientas y oficios con sus fechas en una lista personal y luego envíe todas las solicitudes en un solo paso, como un carrito, pero respetando que en Qatu cada pedido necesita disponibilidad y la aceptación del proveedor.

Interfaz: botón «Agregar a mi lista» en el detalle de cada publicación, que abre el formulario de solicitud con «Guardar en mi lista» como acción principal; contador en el encabezado; página `/lista` con los ítems agrupados por proveedor, avisos de disponibilidad o tarifa cambiada y botón «Enviar solicitudes».

Esta especificación cubre la **etapa 1**. Quedan fuera y se especificarán aparte: favoritos, avisos por cambios en ítems guardados y el pago conjunto de varias reservas aceptadas, que cambiaría la regla vigente de un pago por reserva (005.8).

La lista no separa fechas, no crea solicitudes al agregar y no avisa al proveedor. Solo «Enviar solicitudes» crea solicitudes, con las mismas reglas que una solicitud individual de 005.

## User Scenarios & Testing

### US1 — Guardar en mi lista (P1)

Como cliente con sesión, quiero guardar una herramienta con sus fechas o un oficio con la descripción del trabajo, para decidir después.

**Prueba independiente:** Dado un cliente con sesión en una publicación activa, cuando elige fechas válidas y toca «Agregar a mi lista», entonces el ítem aparece en `/lista`, el contador del encabezado aumenta y no se crea ninguna solicitud.

**Caso negativo:** el proveedor no puede agregar su propia publicación; fechas pasadas, fin anterior al inicio, una publicación inactiva, un duplicado exacto o el ítem 21 se rechazan sin cambiar la lista.

### US2 — Ingresar y volver (P1)

Como visitante, quiero que al pedirme iniciar sesión vuelva a la publicación con mi elección guardada.

**Prueba independiente:** Dado un visitante que eligió fechas y tocó «Agregar a mi lista», cuando inicia sesión o crea su cuenta, entonces vuelve a la misma publicación y el ítem queda agregado, con un mensaje que lo confirma.

**Caso negativo:** un parámetro de regreso hacia otro dominio (`//sitio`, `https://…`, `/\sitio`) se ignora y se usa el destino por tipo de cuenta.

### US3 — Enviar la lista (P1)

Como cliente, quiero enviar todas las solicitudes de mi lista en un solo paso.

**Prueba independiente:** Dado una lista con ítems válidos de dos proveedores, cuando toco «Enviar solicitudes», entonces se crea una solicitud por ítem con las reglas de 005, cada proveedor la ve en su bandeja, los ítems enviados salen de la lista y veo el resultado de cada uno.

**Caso negativo:** si un ítem ya no está disponible o su publicación se desactivó, ese ítem queda en la lista con el motivo y los demás se envían igual. Repetir el envío con la misma clave no duplica solicitudes.

### US4 — Revisar antes de enviar (P2)

Como cliente, quiero saber qué cambió desde que guardé un ítem.

**Prueba independiente:** Dado un ítem guardado, cuando la tarifa cambió, las fechas ya pasaron o el recurso se ocupó en esas fechas, entonces `/lista` lo marca con el motivo y pide corregir antes de enviarlo.

**Caso negativo:** otro usuario no puede ver ni modificar mi lista (404).

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M009-FR01 | Guardar, ver y enviar la lista exige sesión; el dueño se deriva de la sesión, nunca del cuerpo. La lista es privada: otro actor recibe 404. | RF de acceso (002), RN de privacidad |
| M009-FR02 | Publicación activa y unidad activa (la herramienta o la agenda del oficio), inicio futuro y fin posterior, con los mismos formatos que una solicitud. Oficio: descripción del trabajo de 20 a 1500 caracteres, como en 005. | Reglas de solicitud de 005 |
| M009-FR03 | Agregar no reserva ni bloquea disponibilidad, no crea solicitudes y no genera avisos. | 005 (disponibilidad) |
| M009-FR04 | Máximo 20 ítems por cliente; sin duplicados exactos (misma publicación, recurso e intervalo); el proveedor no agrega sus propias publicaciones. | Integridad |
| M009-FR05 | Al consultar la lista se revalida cada ítem: publicación activa, tarifa actual frente a la guardada, fechas aún futuras y recurso libre. El resultado se muestra por ítem y no modifica la lista. | Transparencia de precio |
| M009-FR06 | Enviar crea una solicitud por ítem mediante el caso de uso existente de 005; cada ítem tiene su resultado. El ítem sale de la lista antes de crear su solicitud (dos envíos a la vez no la duplican) y vuelve con el motivo si la solicitud se rechaza. Requiere `Idempotency-Key`; la misma clave devuelve el mismo resultado y con otro pedido responde 409. | 005, idempotencia |
| M009-FR07 | El regreso tras el ingreso solo acepta rutas internas relativas: empiezan con `/`, no con `//` ni `/\`, sin esquema ni host. Si no es válida se usa el destino por tipo de cuenta. | Seguridad (redirección abierta) |
| M009-FR08 | La intención pendiente de un visitante (publicación, recurso, fechas o descripción) se guarda solo en el navegador de esa sesión y se aplica una vez tras el ingreso; si falla, se muestra el motivo y no se reintenta sola. | US2 |

## Key Entities

Ítem de lista: cliente, publicación, recurso (solo herramientas), tipo, inicio y fin o fecha propuesta, descripción (solo oficios), tarifa vista al guardar y fecha de creación. Propiedad del módulo Reservas como borrador de solicitud. Lee Catálogo por su fachada pública; no copia datos autoritativos más allá de la tarifa vista para avisar cambios.

[Modelo específico](./data-model.md) · [Contrato HTTP](./contracts/api.md).

## Edge Cases

- Fechas de un ítem que pasan mientras está guardado: se marca «Fechas vencidas» y no se envía hasta corregirlas.
- Publicación desactivada o proveedor suspendido: el ítem queda marcado y se puede quitar.
- Dos pestañas envían la misma lista: la clave de idempotencia y el borrado transaccional evitan solicitudes dobles.
- Lista con ítems de varios proveedores: se agrupan en pantalla por proveedor; cada ítem sigue siendo una solicitud independiente.
- Cuenta desactivada: su lista no se muestra y se borra con la limpieza de cuentas inactivas.

## Success Criteria

- SC01: los recorridos US1–US3 pasan con PostgreSQL real y en navegador a 360 y 1440 px.
- SC02: los accesos indebidos (lista ajena, proveedor sobre su publicación, regreso a otro dominio) se rechazan sin mutar datos.
- SC03: un envío repetido o concurrente no duplica solicitudes; los ítems enviados y sus solicitudes quedan consistentes.
- SC04: la tarifa y la disponibilidad que muestra la lista coinciden con las de Catálogo y Reservas en el momento de consultar.

## Clarifications

- Decidido (2026-11-14): guardar exige sesión; el visitante vuelve a la publicación con el ítem agregado tras ingresar o registrarse.
- Decidido: la lista no separa fechas; solo se separan cuando el proveedor acepta, como hoy.
- Decidido: si un proveedor rechaza, el resto sigue su curso; no se cancela la lista entera.
- Decidido (2026-11-15): máximo 20 ítems; los ítems con fechas pasadas se marcan «Las fechas ya pasaron» y se borran 30 días después de su inicio.
- Pendiente: agrupar en una sola solicitud los ítems del mismo proveedor (etapa 2) y el pago conjunto (etapa 3, con la fase de pagos).

## Dependencies

- [002-usuarios-acceso](../002-usuarios-acceso/spec.md): sesión y destino tras el ingreso.
- [004-catalogo-publicaciones](../004-catalogo-publicaciones/spec.md): publicación activa y tarifa.
- [005-reservas-contratacion-pagos](../005-reservas-contratacion-pagos/spec.md): reglas y caso de uso de solicitud.

## Artifacts

[Plan](./plan.md) · [Investigación de decisiones](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).
