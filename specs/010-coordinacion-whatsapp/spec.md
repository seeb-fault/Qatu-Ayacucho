# 010 — Coordinación por WhatsApp

**Estado:** etapa 1 (010.1) implementada y verificada en backend con PostgreSQL real; recorrido de navegador escrito para CI. Etapa 2 (avisos automáticos) pendiente. **Fecha:** 2026-11-15.
**Módulos técnicos:** usuarios (número y consentimiento), reservas (contacto de la contraparte), catálogo (requisito para publicar). **Historias:** pedido de la docente del curso, 2026-11-15.

## Objetivo y alcance

Que cliente y proveedor coordinen por WhatsApp la visita previa, la entrega o devolución de una herramienta y el lugar y la hora de un servicio, sin exponer números a cualquiera y sin sacar de Qatu lo que da garantías (estados, pagos, evidencias, incidencias).

**Etapa 1 (esta entrega):** botón «Escribir a … por WhatsApp» en la reserva, con un enlace `wa.me` y el mensaje ya escrito. Sin API de WhatsApp ni costos.
**Etapa 2 (pendiente):** avisos automáticos por la API de WhatsApp Business como canal del despachador de eventos (D08). Tiene costo por mensaje y requiere verificar un negocio en Meta.

## User Scenarios & Testing

### US1 — Registrar mi WhatsApp (P1)

Como usuario, quiero guardar mi WhatsApp y decidir si se muestra a mis contrapartes.

**Prueba independiente:** Dado un usuario con sesión, cuando guarda `987 654 321` y marca «Mostrar mi WhatsApp…», entonces su perfil devuelve `+51987654321` y el consentimiento activo.
**Caso negativo:** un número que no es celular de Perú o un consentimiento no booleano se rechazan con 400; borrar el número retira el consentimiento.

### US2 — Coordinar una reserva (P1)

Como cliente o proveedor, quiero escribirle a la otra parte por WhatsApp cuando ya hay un compromiso.

**Prueba independiente:** Dado una reserva aceptada (o visita acordada, o cotización enviada), cuando abro la tarjeta, entonces veo «Escribir a … por WhatsApp» con el número de la otra parte y un mensaje con el título y las fechas.
**Caso negativo:** una solicitud pendiente sin respuesta, cerrada, cancelada o rechazada no comparte números (409); un tercero recibe 404; sin consentimiento el número no se entrega.

### US3 — Publicar con un canal de contacto (P1)

Como proveedor, debo registrar mi WhatsApp para publicar ofertas nuevas.

**Prueba independiente:** Dado un proveedor verificado sin WhatsApp visible, cuando publica, entonces recibe 409 `WHATSAPP_REQUERIDO`; tras registrarlo y permitir mostrarlo, publica normalmente.
**Caso negativo:** guardar el número sin consentimiento no habilita la publicación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad |
|---|---|---|
| M010-FR01 | El número se guarda normalizado como `+519XXXXXXXX`; la base rechaza otro formato y un consentimiento activo sin número. | Integridad |
| M010-FR02 | El número solo se entrega a la contraparte de una reserva, si su dueño consintió y su cuenta está activa. Nunca aparece en listados, perfiles públicos ni en la administración de usuarios. | Privacidad |
| M010-FR03 | Se comparte en VISITA_ACORDADA, ACEPTADA, APARTADO_PAGADO, ENTREGA_POR_CONFIRMAR, EN_CURSO, DEVOLUCION_PENDIENTE, SERVICIO_CONFIRMADO, SERVICIO_EN_CURSO, SERVICIO_POR_CONFIRMAR, SERVICIO_POR_PAGAR y en PENDIENTE con al menos una cotización enviada. | Momento de la operación |
| M010-FR04 | Publicar una oferta nueva exige WhatsApp visible; editar una oferta existente no se bloquea. | Coordinación con clientes |
| M010-FR05 | El enlace usa `wa.me` con `rel="noopener noreferrer"` y un mensaje que identifica la reserva; la interfaz recuerda que los cambios, la entrega y el pago se confirman en Qatu. | Trazabilidad de la operación |

## Key Entities

Usuario: `whatsapp` (nulo o `+519XXXXXXXX`) y `whatsapp_visible`. Contacto de reserva: `{ rol, nombre, whatsapp }` calculado al consultar; no se copia el número en Reservas.

[Modelo específico](./data-model.md) · [Contrato HTTP](./contracts/api.md).

## Edge Cases

- La contraparte retira su consentimiento: el botón se reemplaza por «aún no comparte su WhatsApp».
- Cuenta desactivada: su número deja de entregarse.
- Un proveedor que ya tenía ofertas y no registra WhatsApp puede editarlas, pero no publicar nuevas.

## Success Criteria

- SC01: US1–US3 pasan con PostgreSQL real y el botón se verifica en navegador a 1440 y 360 px.
- SC02: ningún número sale fuera de las reservas activas de sus participantes.

## Clarifications

- Decidido (2026-11-15): compartir desde el compromiso y hasta el cierre; WhatsApp obligatorio para que el proveedor publique; etapa 2 con costo, diferida.

## Dependencies

[002-usuarios-acceso](../002-usuarios-acceso/spec.md) · [004-catalogo-publicaciones](../004-catalogo-publicaciones/spec.md) · [005-reservas-contratacion-pagos](../005-reservas-contratacion-pagos/spec.md).

## Artifacts

[Plan](./plan.md) · [Investigación de decisiones](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).
