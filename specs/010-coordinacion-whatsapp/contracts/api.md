# Contrato HTTP — Coordinación por WhatsApp

| Método | Ruta | Cuerpo / respuesta | Errores |
|---|---|---|---|
| GET | /usuarios/me | Añade `whatsapp` (`+519…` o null) y `whatsappVisible` al perfil propio | 401 |
| PATCH | /usuarios/me | `{ nombre, whatsapp?, whatsappVisible? }`. `whatsapp` admite 9 dígitos con o sin `+51`, espacios o guiones; `''` o null lo borra y retira el consentimiento. Omitirlo conserva el valor | 400 formato inválido; 401 |
| GET | /reservas/:id/contacto | Solo participantes: `{ rol: 'cliente' \| 'proveedor', nombre, whatsapp }`; `whatsapp` es null si la otra parte no consintió | 401; 404 si no participa; 409 `CONTACTO_NO_DISPONIBLE` fuera de los estados de M010-FR03 |
| POST | /publicaciones | Sin cambios en el cuerpo | 409 `WHATSAPP_REQUERIDO` si el proveedor no tiene WhatsApp visible |

El enlace se arma en el navegador: `https://wa.me/<dígitos>?text=<mensaje codificado>`, con `target="_blank"` y `rel="noopener noreferrer"`.
