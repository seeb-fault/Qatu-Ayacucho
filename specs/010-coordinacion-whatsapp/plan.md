# Plan — Coordinación por WhatsApp

## Etapa 1

- **Usuarios:** columnas `whatsapp` y `whatsapp_visible`; validación `whatsappValido` en dominio; el perfil propio los lee y edita; la fachada `IdentidadUsuarios` expone `contactoPublico` y `tieneWhatsapp`.
- **Reservas:** `dominio/coordinacion.ts` define los estados que comparten contacto; `Reservas.contacto` verifica participación y estado; ruta `GET /reservas/:id/contacto`.
- **Catálogo:** `crear` exige `tieneWhatsapp` del titular.
- **Web:** campo WhatsApp con prefijo +51 y consentimiento en Mi cuenta; `CoordinarWhatsapp` en la tarjeta de la reserva, con el mensaje armado y el aviso de confirmar en Qatu; verde `#0E7A3E` (contraste 5,4:1 con blanco).

## Etapa 2

Adaptador de WhatsApp Business para el puerto `Notificador`, plantillas aprobadas y presupuesto (D08).

## Pruebas

Unitarias de formato y estados; integración con PostgreSQL (consentimiento, participantes, momento, publicación); recorrido de navegador del botón tras la aceptación.
