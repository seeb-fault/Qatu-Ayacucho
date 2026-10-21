# Contrato de interfaz — Descubrimiento

Rutas web propuestas: /, /buscar y /publicaciones/:id. Enlaces navegables y etiquetas de campos accesibles. Estado de filtros representado en URL sin documentos ni datos privados.

Consumo REST existente: GET /api/v1/publicaciones y GET /api/v1/publicaciones/:id. Perfiles/reputación usan las rutas públicas propuestas de 003/006 cuando se congelen. Texto convencional y filtros solo incluyen claves permitidas; respuesta paginada con ofertas reales.

Vista de herramienta: tarifa por unidad, condiciones, proveedor y distrito. Vista de oficio: especialidad, alcance/exclusiones y modalidad de cotización. Sin datos se informa ausencia; no se inventan precios/reseñas. Pantalla desactivada/no encontrada permite volver; no se ejecutan solicitudes/pagos en esta entrega.

[Contrato Catálogo](../../004-catalogo-publicaciones/contracts/api.md).

## Contrato del prototipo local

Filtros de URL: q, tipo, categoria, distrito, precio (soles), pagina y orden (recomendados/precio/nombre). Limitar texto a 200 caracteres y presupuesto entero no negativo. El adapter local retorna los resultados sintéticos; estos nombres no congelan el REST de Catálogo. La variante escenario=error existe solo para demostrar recuperación desde /demo y se elimina al reintentar, conservando los filtros.
