# Plan — Mapas y ubicación

## Etapa 1

- **Catálogo:** `dominio/ubicacion.ts` (zona de servicio, punto público, distancia); tabla `catalogo_ubicaciones`; rutas del dueño; el punto público se incluye en la selección de publicaciones; la fachada `ConsultaCatalogo` expone `ubicacionExacta`.
- **Reservas:** `contacto` suma el punto exacto con la misma regla del WhatsApp.
- **Web:** `components/mapa/Mapa.tsx` (Leaflet cargado solo en el navegador, pin rojo para exactas y círculo de 100 m para casi exactas, `ResizeObserver` para recalcular el tamaño); `EditorUbicacion` en la gestión de ofertas; `UbicacionOferta` en el detalle; `MapaResultados` en la búsqueda; mapa del punto exacto en la tarjeta de la reserva.

## Etapa 2

Lugar del trabajo marcado por el cliente en los oficios, «Cerca de ti» con distancias (PostGIS) y ordenamiento por cercanía.
