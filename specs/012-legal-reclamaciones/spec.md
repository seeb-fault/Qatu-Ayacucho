# 012 — Información legal y Libro de Reclamaciones

**Estado:** etapa 1 (012.1) implementada; validación con PostgreSQL real y en navegador según [quickstart](./quickstart.md). **Fecha:** 2026-11-16.
**Módulos técnicos:** reputación y confianza (`resenas`: Libro de Reclamaciones), usuarios (cuota de intentos por su fachada) y web (páginas legales). **Historias:** pedido del equipo, 2026-11-16, a partir de los requisitos de URL de Culqi para aprobar un comercio.

## Objetivo y alcance

Que Qatu cumpla la información legal mínima de una tienda en línea en el Perú y lo que Culqi revisa antes de aprobar un comercio:

- **Libro de Reclamaciones virtual** integrado en la web, sin formularios ni enlaces externos (Ley 29571; Reglamento DS 011-2011-PCM, modificado por DS 101-2022-PCM).
- **Términos y condiciones**, **política de cancelaciones, cambios y devoluciones** y **política de privacidad** (Ley 29733), redactadas según cómo funciona Qatu hoy.
- **Contacto** con correo, teléfono y dirección del titular.
- Enlaces permanentes a todo lo anterior en el pie de página, con el aviso del Libro de Reclamaciones visible en todas las páginas.

Fuera de esta etapa: el envío automático de la constancia y de la respuesta por correo (no hay proveedor de correo; se decide en 008), la suspensión del plazo por ofrecimiento de solución, el aviso automático a la administración cuando una hoja está por vencer y la exportación de las hojas.

## User Scenarios & Testing

### US1 — Presentar un reclamo o una queja (P1)

Como consumidor, con o sin cuenta, quiero dejar constancia de un reclamo o una queja.
**Prueba independiente:** Dado el Libro de Reclamaciones, cuando completo la hoja y la envío, entonces recibo una constancia con un número correlativo (`LR-AAAA-NNNNNN`), la fecha, el plazo de respuesta y un código de consulta, que puedo imprimir o guardar en PDF.
**Caso negativo:** datos incompletos o un documento inválido se rechazan (400) con un mensaje claro; más de 3 hojas del mismo documento en 15 minutos se frenan (429).

### US2 — Consultar el estado (P2)

Como consumidor, quiero ver si mi hoja ya tiene respuesta.
**Prueba independiente:** Dado el número y el código de consulta, cuando consulto, entonces veo mi hoja y, si existe, la respuesta.
**Caso negativo:** con un código incorrecto no se revela nada (404).

### US3 — Atender las hojas (P1)

Como administrador, quiero ver las hojas pendientes ordenadas por vencimiento y registrar la respuesta enviada.
**Prueba independiente:** Dado una hoja pendiente, cuando registro la respuesta y el medio por el que la envié, entonces pasa a «Respondidas» y el consumidor la ve en su consulta.
**Caso negativo:** una cuenta sin rol de administrador recibe 403; una segunda respuesta a la misma hoja recibe 409.

### US4 — Información legal accesible (P1)

Como visitante, quiero encontrar los términos, la política de devoluciones, la privacidad y el contacto.
**Prueba independiente:** Dado cualquier página, cuando uso el pie de página, entonces llego a cada documento, legible a 360 px y sin desborde.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad |
|---|---|---|
| M012-FR01 | La hoja registra: tipo (reclamo o queja), titular de Qatu vigente al presentarla, consumidor (nombre, documento, domicilio, correo, celular opcional; padre, madre o apoderado si es menor), bien contratado (producto o servicio, descripción, monto opcional), detalle, pedido y medio de respuesta (correo o carta). | Reglamento del Libro de Reclamaciones |
| M012-FR02 | Número correlativo por año, sin saltos ni repetidos aunque lleguen hojas simultáneas; fecha y hora de presentación. | Reglamento |
| M012-FR03 | Vencimiento a 15 días hábiles desde el día siguiente, en hora de Lima. Solo descuenta fines de semana: con feriados el plazo calculado es igual o más corto que el legal, nunca más largo. | DS 101-2022-PCM |
| M012-FR04 | Presentar no exige cuenta ni pago. Con sesión, la hoja se vincula a la cuenta. | DS 101-2022-PCM, art. 6 |
| M012-FR05 | La hoja no se edita ni se borra; solo se le agrega una respuesta, una vez, con fecha, medio y administrador. La base lo garantiza con restricciones. | Integridad |
| M012-FR06 | La consulta pública exige número y código; el código solo se guarda como huella SHA-256. | Privacidad |
| M012-FR07 | Términos, devoluciones, privacidad y contacto describen el comportamiento real de Qatu (cancelación antes de la entrega, reembolso completo de pagos en línea, efectivo directo al proveedor, incidencias hasta 48 h, evidencias 90 días). | Culqi, Ley 29571, Ley 29733 |
| M012-FR08 | Los datos del titular (razón social, RUC, dirección, correo, teléfono) se configuran en el backend (`QATU_TITULAR_*`). Sin configurar, las páginas muestran «Por definir»: nunca datos inventados. | Veracidad |

## Key Entities

`reclamaciones_hojas` y `reclamaciones_correlativo`. Ver [modelo](./data-model.md) y [contrato](./contracts/api.md).

## Edge Cases

- Una hoja presentada a las 22:00 del viernes en Lima (sábado en UTC) cuenta como del viernes.
- Dos administradores responden a la vez: una respuesta queda registrada y la otra recibe 409.
- Detrás del proxy de Next todas las peticiones llegan al backend desde la misma IP; por eso la cuota que limita es la del documento.
- Si la API no responde, las páginas legales igual se muestran, con el titular «Por definir».

## Success Criteria

- SC01: US1–US4 con PostgreSQL real y en navegador a 1280 y 360 px sin desborde.
- SC02: numeración correlativa sin saltos con presentaciones simultáneas.
- SC03: los datos del titular son configurables y nunca se inventan.

## Clarifications

- Decidido (2026-11-16): el libro vive en Reputación y confianza, junto a las incidencias; no se crea un módulo nuevo.
- Decidido (2026-11-16): la respuesta la envía la administración por el medio elegido y luego la registra en Qatu; el envío automático espera al proveedor de correo (008).
- Pendiente (D-012-1): los datos reales del titular (RUC, dirección, correo y teléfono) y la revisión de los textos legales por una persona con formación legal antes de producción.

## Dependencies

[006-reputacion-confianza](../006-reputacion-confianza/spec.md) (incidencias) · [005-reservas-contratacion-pagos](../005-reservas-contratacion-pagos/spec.md) (cancelación y reembolso) · [008-despliegue-validacion](../008-despliegue-validacion/spec.md) (HTTPS y correo).

## Artifacts

[Plan](./plan.md) · [Investigación](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).
