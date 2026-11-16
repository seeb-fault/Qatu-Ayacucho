# 011 — Mapas y ubicación

**Estado:** etapa 1 (011.1) implementada y verificada con PostgreSQL real y en una vista previa completa; recorrido de navegador escrito para CI. **Fecha:** 2026-11-15.
**Módulos técnicos:** catálogo (ubicación de la oferta), reservas (punto exacto para la contraparte). **Historias:** pedido del equipo, 2026-11-15.

## Objetivo y alcance

Mostrar en un mapa dónde está cada herramienta u oficio, para que el cliente sepa qué tan cerca está, sin exponer la casa del proveedor a cualquiera.

- Mapa gratuito: Leaflet con mosaicos de OpenStreetMap, sin claves ni tarjeta.
- El proveedor marca el punto tocando el mapa, arrastrando el pin o con «Usar mi ubicación», y elige qué ve el público:
  - **Exacta:** para un taller, tienda o ferretería abiertos al público.
  - **Casi exacta (por defecto):** un punto desplazado entre 50 y 100 m, siempre el mismo, dibujado como un círculo de 100 m.
- Desde que hay compromiso (visita acordada, cotización enviada o reserva aceptada) y hasta el cierre, la contraparte ve el punto exacto con «Abrir en Google Maps».
- Mapa en el detalle de la oferta y botón «Ver en el mapa» en los resultados.

Fuera de esta etapa: el cliente marca el lugar del trabajo en un oficio, «Cerca de ti» con distancias, y la búsqueda de direcciones por texto.

## User Scenarios & Testing

### US1 — Marcar la ubicación (P1)

Como proveedor, quiero marcar dónde está mi herramienta o desde dónde trabajo.
**Prueba independiente:** Dado el editor de una oferta propia, cuando toco el mapa y guardo con «Casi exacta», entonces se guarda el punto y el público verá otro a 50–100 m.
**Caso negativo:** un punto fuera de la zona de servicio se rechaza (400); otra cuenta no ve ni cambia la ubicación (404).

### US2 — Ver la zona antes de reservar (P1)

Como cliente, quiero ver en el mapa dónde está la oferta.
**Prueba independiente:** Dado una oferta con ubicación casi exacta, cuando abro su detalle o «Ver en el mapa» en los resultados, entonces veo un círculo de 100 m y el aviso de que el punto exacto llega con la aceptación.
**Caso negativo:** el punto exacto no aparece en el detalle ni en el listado público.

### US3 — Llegar al punto exacto (P1)

Como cliente con una reserva aceptada, quiero el punto exacto para llegar.
**Prueba independiente:** Dado una reserva aceptada, cuando abro su tarjeta, entonces veo el mapa del punto exacto y «Abrir en Google Maps».
**Caso negativo:** con la solicitud pendiente no se entrega (409, como el WhatsApp de 010).

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad |
|---|---|---|
| M011-FR01 | Puntos dentro de la zona de servicio (lat −13,6 a −12,6; lng −74,7 a −73,7), validados en dominio y en la base. | Integridad |
| M011-FR02 | «Exacta»: punto público igual al exacto. «Aproximada»: desplazado 50–100 m en una dirección fija para cada proveedor y lugar, para que varias ofertas no permitan promediar. | Privacidad |
| M011-FR03 | El punto exacto solo se entrega al dueño (`GET /publicaciones/:id/ubicacion`) y a la contraparte de una reserva activa (`GET /reservas/:id/contacto`), con los estados de M010-FR03. | Privacidad |
| M011-FR04 | Sin claves ni servicios de pago: mosaicos de OpenStreetMap con su atribución visible; «Cómo llegar» por enlaces de Google Maps u OpenStreetMap. | Costo cero |
| M011-FR05 | La ubicación es opcional: una oferta sin ubicación funciona igual y no muestra mapa. | Compatibilidad |

## Key Entities

`catalogo_ubicaciones`: punto exacto, precisión y punto público por publicación. Ver [modelo](./data-model.md) y [contrato](./contracts/api.md).

## Edge Cases

- Cambiar de «Casi exacta» a «Exacta» o mover el punto recalcula el público.
- «Quitar del mapa» borra la ubicación; el detalle deja de mostrar el mapa.
- Varias ofertas del mismo proveedor en el mismo lugar muestran el mismo punto público.

## Success Criteria

- SC01: US1–US3 con PostgreSQL real y en navegador a 1280 y 360 px sin desborde.
- SC02: el punto exacto nunca aparece en respuestas públicas.

## Clarifications

- Decidido (2026-11-15): Leaflet + OpenStreetMap; cada proveedor elige exacta o casi exacta a 100 m; el punto exacto con la misma regla que el WhatsApp.

## Dependencies

[004-catalogo-publicaciones](../004-catalogo-publicaciones/spec.md) · [010-coordinacion-whatsapp](../010-coordinacion-whatsapp/spec.md).

## Artifacts

[Plan](./plan.md) · [Investigación](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).
