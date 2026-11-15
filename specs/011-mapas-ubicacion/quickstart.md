# Validación — Mapas y ubicación

## Recorrido manual

1. Como proveedor, en «Publicar una oferta», editar una oferta, tocar el mapa (o «Usar mi ubicación»), elegir «Casi exacta» y guardar.
2. Abrir el detalle de la oferta: un círculo de 100 m y el aviso de que el punto exacto llega con la aceptación.
3. En los resultados, «Ver en el mapa».
4. Aceptar una reserva: el cliente ve el punto exacto y «Abrir en Google Maps».

## Validación local de la etapa 1 (2026-11-15)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS 17.5 en Docker, bases nuevas `_test`. No se modificó `.env`.
- Backend: `test/catalogo/ubicacion.test.ts` aprobó 6 de 6. En dominio: zona de servicio, punto exacto igual al público, desplazamiento entre 49 y 101 m, mismo punto para el mismo proveedor y lugar, distinto para otro proveedor. Con PostgreSQL real: anónimo 401, otra cuenta 404, fuera de zona 400; el detalle y el listado públicos no contienen el punto exacto; el dueño lo ve; la contraparte lo recibe recién tras la aceptación (409 antes); «Exacta» lo publica tal cual y quitarla oculta el mapa.
- La migración `catalogo/002-ubicaciones` se aplicó, se revirtió y se volvió a aplicar.
- Vista previa completa (backend en 3400 con base `_test`, frontend de producción en 3300): el proveedor marcó el punto en el editor y guardó «Casi exacta»; el detalle mostró el círculo y el aviso; «Ver en el mapa» cargó los mosaicos completos a 1280 y 390 px; tras aceptar, la tarjeta mostró el WhatsApp, el mapa del punto exacto y `https://www.google.com/maps/search/?api=1&query=…`. Sin desborde a 360 px. Se corrigieron el subrayado de los botones de zoom y los mosaicos incompletos al abrir el mapa de resultados (`ResizeObserver`).
- Pendiente en CI: `frontend/tests/reservas/mapa.spec.ts` (los mosaicos se sustituyen por respuestas vacías para no salir a internet).
