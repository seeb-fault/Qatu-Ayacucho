# Contrato HTTP — Mapas y ubicación

| Método | Ruta | Cuerpo / respuesta | Errores |
|---|---|---|---|
| GET | /publicaciones, /publicaciones/:id | Añade `ubicacion: { lat, lng, precision } \| null` con el punto **público** | — |
| GET | /publicaciones/:id/ubicacion | Solo el dueño: `{ ubicacion: { lat, lng, precision, publica: { lat, lng } } \| null }` | 401; 404 si no es su oferta |
| PUT | /publicaciones/:id/ubicacion | `{ lat, lng, precision: 'exacta' \| 'aproximada' }` → la ubicación guardada | 400 fuera de la zona o datos inválidos; 401; 404 |
| DELETE | /publicaciones/:id/ubicacion | Cuerpo `{}` → 204 | 401; 404 |
| GET | /reservas/:id/contacto | Añade `ubicacion: { lat, lng } \| null` con el punto **exacto** | Igual que en 010 (409 fuera de los estados permitidos) |

Mosaicos: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` con atribución. Enlaces: `https://www.google.com/maps/search/?api=1&query=lat,lng` y `https://www.openstreetmap.org/?mlat=…&mlon=…`.
