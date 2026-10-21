# 001 — Descubrimiento y consulta de ofertas

**Proyecto:** Qatu. **Estado:** prototipo de interfaz implementado y validado con fixtures; aceptación integrada pendiente. **Fecha:** 15/10/2026.

## Objetivo

Permitir que una persona encuentre herramientas de alquiler y servicios de oficios en Ayacucho, compare información y consulte una oferta antes de iniciar una contratación. El recorrido público debe funcionar sin cuenta.

## Alcance

Inicio, búsqueda convencional, resultados y detalle de herramienta/oficio. Filtros de texto, tipo de oferta, categoría, distrito y presupuesto; navegación móvil y de escritorio; estados de carga, vacío, error y publicación no disponible. El primer prototipo puede usar datos ficticios señalados como demostración. La entrega funcional requerirá consultar datos persistidos a través del backend.

Las solicitudes, autenticación, publicación, bloqueo de agenda, cotizaciones aceptadas, pagos y búsqueda con IA corresponden a entregas posteriores. Esta separación no cambia los requisitos del MVP completo.

## Historias y escenarios de aceptación

### US1 (E001-H01) — Encontrar ofertas (prioridad alta)

Como visitante quiero buscar por texto y filtros para encontrar ofertas de mi zona.

- **Dado** un catálogo de demostración o persistido, **cuando** busco un texto y elijo tipo, categoría y distrito, **entonces** veo únicamente las coincidencias según los filtros aplicados y esos filtros permanecen visibles.
- **Dado** un resultado filtrado, **cuando** cambio o elimino un filtro, **entonces** se actualizan los resultados y puedo conservar los demás criterios.
- **Dado** que todavía no existe interpretación por IA, **cuando** envío una frase, **entonces** se procesa como búsqueda convencional y la interfaz no afirma haber entendido intención, fechas o presupuesto con IA.

### US2 (E001-H02) — Comparar resultados (prioridad alta)

Como visitante quiero distinguir herramientas y oficios para comprender su modalidad de contratación.

- Cada tarjeta muestra título, tipo, distrito y tarifa con su unidad cuando existe; un servicio de precio variable muestra que requiere cotización.
- Las tarjetas no muestran disponibilidad para un periodo sin una consulta de fechas válida. Tampoco convierten un precio orientativo en total de contratación.
- Cuando no existen coincidencias, se muestra un estado vacío y una acción para ajustar filtros, sin inventar ofertas.

### US3 (E001-H03) — Consultar el detalle (prioridad alta)

Como visitante quiero conocer el recurso o servicio y a su proveedor antes de solicitarlo.

- Al abrir una herramienta veo descripción, imágenes o alternativa si faltan, tarifa/unidad, distrito, especificaciones y condiciones publicadas.
- Al abrir un oficio veo especialidad, alcance, exclusiones, zona atendida, modalidad de precio y experiencia declarada si están disponibles.
- El proveedor muestra reputación y número de reseñas reales cuando existen; sin reseñas se indica ese estado. La insignia de verificado solo corresponde a un estado de verificación registrado.
- Una publicación inexistente o desactivada muestra un estado comprensible y permite volver a explorar; no permite presentar una solicitud operativa desde esta entrega.

### US4 (E001-H04) — Recuperarse de fallos y usar móvil (prioridad alta)

Como visitante quiero conservar mi búsqueda y navegar desde mi teléfono.

- Ante un error de consulta veo una explicación breve y puedo reintentar sin perder los filtros.
- Durante la carga veo un estado explícito; se evita presentar los datos anteriores como resultados de una consulta nueva.
- A 360/390 px y en escritorio el contenido principal no requiere desplazamiento horizontal. La navegación y los formularios funcionan con teclado y etiquetas accesibles.

## Requisitos de esta entrega

| ID | Comportamiento requerido | Referencia existente |
|---|---|---|
| E001-R01 | Consultar ofertas públicas activas mediante búsqueda convencional | HU01; RF01 |
| E001-R02 | Mantener filtros visibles y editables, compatibles con tipo/categoría/distrito | RF01; UI01–UI04 |
| E001-R03 | Distinguir tarifa de alquiler, precio orientativo y servicio sujeto a cotización | RF02; RF23 como dependencia posterior |
| E001-R04 | Consultar detalle y resumen de proveedor sin exponer datos privados | RF02; RF13 |
| E001-R05 | Mostrar reputación y verificación sin valores o insignias inventadas | RF11; RF13 |
| E001-R06 | Gestionar carga, vacío, error y publicación no disponible | AC06; EQ-06 |
| E001-R07 | Identificar datos sintéticos y funcionalidades pendientes del prototipo | Propuesta de interfaz |

Los identificadores E001 son locales a esta entrega y no renumeran los RF/HU originales.

## Datos y reglas

- Herramienta y servicio son tipos de publicación del dominio Qatu; cada categoría debe corresponder al tipo elegido.
- La zona pública se expresa por distrito. El detalle público no expone documentos de identidad ni direcciones privadas de operaciones.
- Las tarifas se expresan en soles con su unidad. La fecha, cuando se presente, utiliza el contexto America/Lima.
- Una oferta sin imagen muestra una alternativa; una sin reseñas muestra ausencia de reseñas, nunca puntuaciones ficticias salvo datos de demostración identificados.
- Cambiar de tipo invalida una categoría incompatible y hace visible ese ajuste.
- La fuente de datos de demostración y la persistida deben distinguirse durante la verificación.

## Casos límite

Texto sin coincidencias; texto vacío con filtros; distrito sin ofertas; categoría incompatible; error de red; imagen ausente; proveedor sin reseñas; publicación desactivada entre listado y detalle. El plan concretará límites de entrada, paginación y semántica de coincidencia antes de implementar el backend.

## Criterios de finalización

1. El recorrido inicio → resultados → detalle se verifica con ofertas de ambos tipos.
2. Los escenarios anteriores se comprueban en escritorio y a 360/390 px, incluyendo teclado, vacío y error.
3. Se registra qué se verificó con datos sintéticos y qué con backend/base de datos; el prototipo por sí solo no cierra la entrega funcional.
4. La implementación preserva los límites de los seis módulos y los contratos vigentes o documenta su revisión.
5. El plan y las tareas vinculan los requisitos E001 con la evidencia de validación. Ninguna casilla se marca por haber escrito la especificación.

## Dependencias y decisiones pendientes

Esta especificación reutiliza el diseño del catálogo, proveedores y reputación. El plan debe precisar semántica de búsqueda convencional, filtros REST, orden/paginación, datos iniciales y validación de entradas. No se necesita decidir la duración cobrable del alquiler para consultar una tarifa diaria; esa decisión corresponde a reservas antes de calcular totales.

## Referencias

- [Requisitos funcionales](../../docs/01-analisis-de-sistema/03-requisitos-funcionales.md).
- [Escenarios de calidad](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- [Contratos REST](../../docs/03-diseño-de-software/diseño-externo/contratos-api.md).
- [Matriz de adaptación](../../docs/05-ingenieria-inversa/02-matriz-adaptacion-qatu.md).
- [Propuesta de interfaz](../../docs/05-ingenieria-inversa/03-propuesta-interfaz-qatu.md).
- [Lista de revisión](./checklists/requirements.md).
