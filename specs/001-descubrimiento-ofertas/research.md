# Investigación — Descubrimiento

**Decisión:** usar patrones de descubrimiento/detalle de Hygglo y categorías/fichas de Taskrabbit con identidad propia Qatu.
**Motivo:** corresponden a alquileres y oficios. La investigación observó pantallas públicas y límites explícitos; no prueba sus backends ni checkout.
**Alternativas:** reproducir Urbania añadiría conceptos de inmuebles ajenos al alcance. Las fotos/marcas de terceros no serán recursos del producto.

**Decisión propuesta:** filtros persistidos en URL, lista primero y mapa externo en integración posterior obligatoria por RC06; falla de mapa conserva distrito manual.
**Pendiente:** cerrar semántica textual/DTO con Catálogo antes de conectar API real. No se necesita elegir política de días de cobro para mostrar tarifa/unidad.

[Matriz de adaptación](../../docs/05-ingenieria-inversa/02-matriz-adaptacion-qatu.md).

## Decisiones del prototipo implementado (2026-10-15)

- Next.js 16.4.1, React 19.3.1, TypeScript 5.9.3 y Node 24.21.0; versiones exactas y package-lock en frontend.
- Búsqueda local convencional: términos normalizados sin tildes combinados con AND sobre título/categoría/distrito; filtro estructurado combinado con AND, presupuesto en soles y páginas de 20. No es el buscador PostgreSQL final de D04.
- Criterios persistidos en URL y retorno del detalle validado hacia /buscar. Categoría incompatible se limpia con mensaje visible.
- Adapter src/lib/api/publicaciones.ts consume fixtures de src/lib/catalogo.ts; no se crea API HTTP de simulación. Pantalla /demo permite probar error/reintento, vacío, imagen ausente y publicación inactiva.
- Ilustraciones SVG originales y fuente de datos identificada en barra, tarjetas/secciones y detalles. No se reutilizan imágenes de investigación.
- Paleta verde/crema/terracota y tipografías DM Sans/Manrope con fallback; los servicios muestran A cotizar y no se comparan por presupuesto sin tarifa numérica.
- Prototipo local dentro del checkout Next.js para posterior API NestJS/VPS. No se crea un despliegue Sites ni se publica contenido en terceros en esta fase.

D04 de contrato backend y políticas de reserva/pago siguen pendientes en sus módulos.
