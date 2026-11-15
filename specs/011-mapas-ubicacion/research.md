# Investigación — Mapas y ubicación

## Decisiones (2026-11-15, Santiago Noe)

- **Leaflet + OpenStreetMap.** Gratis, sin claves ni tarjeta, unos 40 KB; adecuado para un hosting con pocos recursos. Ayacucho está bien cubierta en OpenStreetMap. Se muestra la atribución «© OpenStreetMap». Si el tráfico crece, la política de uso de los mosaicos pide un proveedor propio o de pago; el cambio es una sola URL en `Mapa.tsx`.
- **Sin buscador de direcciones.** Los servicios gratuitos de geocodificación son lentos y limitados, y muchas direcciones de Ayacucho no tienen número. El proveedor toca el mapa, arrastra el pin o usa la ubicación del navegador.
- **Exacta o casi exacta, a elección del proveedor.** El equipo pidió «casi el punto exacto» en vez de un radio de 500 m. Para no exponer casas, «casi exacta» desplaza el punto entre 50 y 100 m; «exacta» es para locales abiertos al público.
- **Desplazamiento fijo por proveedor y lugar.** Se deriva de un hash del proveedor y del punto redondeado: varias ofertas en la misma casa muestran el mismo punto, así no se puede promediar para hallarla.
- **Coordenadas numéricas, sin PostGIS.** La etapa 1 no necesita consultas espaciales; se evita depender de la extensión en el despliegue. Para «Cerca de ti» se evaluará PostGIS.
- **Punto exacto con la regla de 010.** Reservas lo pide a Catálogo por su fachada (`ubicacionExacta`) y lo entrega junto con el WhatsApp.

## Alternativas descartadas

- Google Maps JavaScript API y Mapbox: requieren tarjeta o clave y cobran al superar el crédito gratuito.
- MapLibre GL con mosaicos vectoriales: más pesado (unos 800 KB) para el mismo resultado en esta etapa.
