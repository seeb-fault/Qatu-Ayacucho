# Plan — Información legal y Libro de Reclamaciones

## Etapa 1 (012.1)

- **Reputación y confianza (`resenas`):**
  - `dominio/reclamaciones.ts`: validación de la hoja y de la respuesta, documentos (DNI, CE, pasaporte, RUC), plazo en días hábiles en hora de Lima, número `LR-AAAA-NNNNNN` y titular desde `QATU_TITULAR_*`.
  - `infraestructura/postgres-reclamaciones.ts`: contador por año bloqueado en la misma transacción que la hoja; respuesta única con `WHERE respuesta IS NULL`.
  - `aplicacion/reclamaciones.ts`: presentar (con o sin sesión), consultar con código, listar y responder solo con rol de administrador.
  - `presentacion/reclamaciones.controller.ts`: rutas públicas `reclamaciones` y de administración `admin/reclamaciones`.
- **Usuarios:** la fachada `IdentidadUsuarios` expone `limitar` para reutilizar la cuota de intentos sin que otro módulo toque `limites_acceso`.
- **Migración** `resenas/004-libro-reclamaciones` con su `.down`.
- **Web:**
  - Páginas `/libro-de-reclamaciones`, `/terminos`, `/devoluciones`, `/privacidad` y `/contacto`.
  - Componentes `components/legal/` (formulario, constancia imprimible, consulta, datos del titular y atención).
  - `/admin/reclamaciones`, con su acceso en «Mi perfil».
  - Columna «Legal» en el pie de página con el aviso del Libro de Reclamaciones.

## Etapa 2

- Envío automático de la constancia y de la respuesta por correo (requiere proveedor de correo, 008).
- Suspensión del plazo por ofrecimiento de solución (hasta 5 días hábiles) con la aceptación expresa del consumidor.
- Aviso a la administración cuando una hoja está por vencer; exportación de las hojas.
- Calendario de feriados para un plazo exacto (hoy se calcula conservador, solo sin fines de semana).
