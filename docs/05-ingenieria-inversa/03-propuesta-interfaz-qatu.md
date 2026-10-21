# Propuesta de interfaz de Qatu a partir de la investigación

## Estado

Prototipo inicial de descubrimiento implementado en [frontend](../../frontend/README.md) bajo la especificación 001; los flujos de contratación y pagos siguen pendientes. Toma patrones de navegación observados en Hygglo, con textos, identidad, categorías y reglas propias. No se reutilizan su marca, fotografías ni código de interfaz.

## Identidad propuesta

Fondo claro, tipografía legible, verde oscuro como color principal y fotografías propias del catálogo. Colores propuestos: principal #145A46, acción #247A5A, fondo #F6F8F5 y texto #172B24. Validar contraste antes de adoptarlos. No son colores medidos de Hygglo.

Usar soles, distritos de Ayacucho y fechas presentadas en America/Lima. Las herramientas indican precio por día y servicios la unidad/cotización aplicable. Los precios de ejemplo se identifican como ficticios.

## Pantalla 1: inicio

- Encabezado: marca Qatu, publicar, reservas y cuenta.
- Propuesta de valor: resolver reparaciones y trabajos con oferta local.
- Selector principal: Alquilar herramientas / Contratar un oficio.
- Buscador natural con ejemplo de necesidad, distrito y fechas.
- Filtros interpretados visibles después de ejecutar búsqueda.
- Categorías de uso local y publicaciones disponibles para explorar.

En móvil, la entrada natural ocupa una fila; zona y fechas se despliegan como filtros accesibles. No exigir descargar una aplicación.

## Pantalla 2: resultados

Conservar consulta, tipo de oferta, distrito y fechas. Tarjetas con foto, título, tarifa/unidad, distrito y reputación identificada. No añadir una etiqueta de disponible sin consultar fechas. Estado vacío con cambio de zona/fechas/categoría. Mostrar cuándo la IA no pudo interpretar y ofrecer filtros manuales. Mapa opcional después de validar integración.

Componentes previstos: BuscadorNecesidad, FiltrosInterpretados, SelectorTipoOferta, SelectorDistrito, RangoFechas, TarjetaHerramienta, TarjetaServicio y EstadoSinResultados.

## Pantalla 3: detalle de herramienta

Galería y descripción a la izquierda en escritorio; panel de reserva a la derecha. En móvil, contenido en una columna y acción de reserva accesible sin tapar información.

Datos: herramienta, especificaciones, accesorios, proveedor, distrito, condiciones de uso y cancelación. Panel: inicio/fin, duración explicada, tarifa, subtotal, comisión y total cobrable. Garantía documental separada con sus condiciones, sin indicación falsa de custodia.

Estados: sin fechas, validando disponibilidad, fechas válidas, conflicto, publicación desactivada, error de consulta. Al solicitar, el backend vuelve a validar precio y disponibilidad.

Componentes previstos: GaleriaPublicacion, PerfilProveedorResumen, IndicadorVerificacion, CalendarioDisponibilidad, ResumenCotizacion y AccionSolicitarReserva.

## Pantalla 4: detalle de oficio

Especialidad, zona atendida, experiencia declarada y reseñas. Servicios de precio variable solicitan datos y reciben cotización antes del pago. No reutilizar sin adaptación el calendario de alquiler de una herramienta: la agenda representa una atención profesional. La [investigación pública de Taskrabbit](./04-analisis-taskrabbit.md) aporta estructura de solicitud y fichas de profesionales; la agenda y el pago operativos del referente siguen pendientes.

## Pantalla 5: mis reservas y pago

Historial con estados comprensibles, detalle de operación y siguiente acción permitida. Reserva, pago y garantía se muestran como conceptos separados. La pantalla de pago incluye total del servidor, medio habilitado, resultado pendiente/aprobado/rechazado/desconocido y recuperación mediante consulta de estado. El panel no inventa confirmación por timeout.

Este flujo es propuesta de Qatu; no se observó el checkout de Hygglo.

## Navegación móvil propuesta

Buscar → Publicar → Reservas → Perfil. La navegación permite descubrir sin sesión; acciones privadas autentican y validan rol. Publicar puede mostrar el paso de registro/verificación del proveedor.

## Dependencias del prototipo

| Necesidad de interfaz | Contrato existente de Qatu |
|---|---|
| Descubrir y ver detalle | GET /publicaciones; GET /publicaciones/:id |
| Interpretar necesidad | POST /busqueda/intencion |
| Consultar fechas | GET /recursos/:id/disponibilidad |
| Solicitar y consultar operación | POST /reservas; GET /reservas/:id |
| Iniciar y seguir pago | POST /reservas/:id/pagos; GET /reservas/:id/pagos |

[Contratos del proyecto](../03-diseño-de-software/diseño-externo/contratos-api.md). El prototipo puede usar datos sintéticos, claramente identificados; ninguna integración simulada cuenta como pasarela real.

## Orden de construcción propuesto

Aplicar primero la [transición a SDD con Spec Kit](./05-transicion-sdd-spec-kit.md). La primera entrega especificará inicio/resultados/detalle de herramienta y oficio; después acceso/publicación, reservas/cotizaciones, pago sandbox, operación/reputación e IA. Evaluar EQ-06 con usuarios y EQ-10 con consultas etiquetadas antes de afirmar usabilidad o calidad de IA.

## Solicitud de oficio: propuesta complementaria

1. Mostrar especialidad, zona, alcance, exclusiones, reputación y experiencia declarada del proveedor.
2. Pedir descripción y fecha/franja preferida; permitir revisar antes de enviar. No presentar la preferencia como disponibilidad confirmada.
3. Si el precio es variable, mostrar estado de cotización pendiente y luego versión, vigencia, mano de obra, materiales/movilidad, importe a pagar y condiciones.
4. Aceptar cotización y reserva según la secuencia que se especifique; revalidar agenda en el servidor.
5. Mostrar pago y ejecución como estados separados. No cobrar un precio orientativo como si fuera cotización aceptada.

Componentes propuestos: PerfilOficio, AlcanceServicio, FormularioNecesidadServicio, FechaPreferida y DetalleCotizacion. Los nombres no implican código creado.
