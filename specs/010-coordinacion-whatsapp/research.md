# Investigación — Coordinación por WhatsApp

## Decisiones (2026-11-15, Santiago Noe, a pedido de la docente)

- **Enlace `wa.me` en la etapa 1.** Gratis, sin API, sin verificación de negocio en Meta y sin guardar conversaciones. El usuario usa su propio WhatsApp.
- **Compartir desde el compromiso.** Visita acordada, cotización enviada o reserva aceptada, hasta el cierre. Una solicitud pendiente sin respuesta no comparte números: así nadie junta teléfonos de proveedores solo enviando solicitudes.
- **Consentimiento explícito.** Casilla «Mostrar mi WhatsApp solo a quienes tengan una reserva aceptada conmigo». Sin ella el número no sale, aunque esté guardado.
- **Obligatorio para publicar.** El cliente necesita un canal para coordinar; se exige al publicar ofertas nuevas y no al editar, para no bloquear a quienes ya publicaron.
- **Qatu sigue siendo el registro.** El aviso junto al botón recuerda que los cambios de fecha, la entrega y el pago se confirman en Qatu; lo acordado solo por chat no cuenta para una incidencia (006).
- **El número vive en Usuarios.** Reservas lo pide por la fachada `IdentidadUsuarios.contactoPublico` y no lo copia. Catálogo consulta `tieneWhatsapp`. Se mantienen los 7 módulos.
- **Reemplazo del enlace anterior.** La tarjeta tenía «Compartir coordinación por WhatsApp» (`wa.me/?text=`), que obligaba a elegir el destinatario a mano; se retira porque el botón nuevo va directo a la contraparte.

## Etapa 2 (pendiente)

Avisos automáticos (solicitud aceptada, pago confirmado, devolución pendiente) como canal del puerto `Notificador` del despachador de eventos (005.6), con plantillas aprobadas por Meta. Requiere decidir proveedor (API oficial en la nube o un intermediario), presupuesto por mensaje y la verificación del negocio (D08).

## Alternativas descartadas

- Chat propio dentro de Qatu: más infraestructura y moderación; la gente en Ayacucho ya coordina por WhatsApp.
- Mostrar el número en la publicación: expondría a proveedores sin ningún compromiso del cliente.
