# Matriz de adaptación: Hygglo y Taskrabbit → Qatu

## Criterio

Las observaciones se limitan a Hygglo E01-E07 y Taskrabbit T01-T05 del [registro de evidencias](./evidencias/README.md). La columna Qatu es una propuesta, no comportamiento observado ni código implementado. Se mantienen las reglas del proyecto; cambios de política se registran antes de implementarse.

| ID | Evidencia observada | Propuesta para Qatu | Módulos | Trazabilidad existente | Prioridad |
|---|---|---|---|---|---|
| UI01 | E01: búsqueda con artículo, zona y fechas | Buscador con necesidad natural, tipo herramienta/oficio y filtros editables | Búsqueda, Catálogo | HU01/HU15; RF01/RF16 | Alta |
| UI02 | E01/E07: categorías rápidas | Categorías de herramientas y oficios de Ayacucho; separar los dos tipos de oferta | Catálogo | RF01/RF03 | Alta |
| UI03 | E02/E06: ubicación predeterminada y diálogo | Zona inicial visible y editable; alternativa manual sin mapa | Catálogo, Proveedores | RF01; DA06; ADR-005 | Alta |
| UI04 | E06: tarjetas con imagen, zona y tarifa | Tarjeta con foto, tarifa/unidad, distrito y reputación numérica real | Catálogo, Reputación | RF02/RF11 | Alta |
| UI05 | E06: controles de lista y mapa | Lista como primera entrega; mapa cuando integración esté validada | Catálogo | DA06; ADR-005 | Media |
| UI06 | E03: fotografía dominante y detalle | Galería, especificaciones, accesorios, condiciones y proveedor | Catálogo, Proveedores | RF02 | Alta |
| UI07 | E03: perfil e indicadores de confianza | Estado de verificación real, reseñas de operaciones terminadas y distinción proveedor/recurso | Proveedores, Reputación | RF11/RF13 | Alta |
| UI08 | E03/E04: solicitud deshabilitada sin fechas | Deshabilitar mientras faltan datos; explicar por qué; validar nuevamente en servidor | Reservas | RF04/RF05/RF07; EQ-07 | Alta |
| UI09 | E04: precio cambia con el periodo y expone comisión | Snapshot de cotización con duración, tarifa, comisión, garantía documental y total cobrable separados | Reservas | RF09/RF20/RF21 | Alta |
| UI10 | E03: condiciones de cancelación visibles | Política propia y estados separados de reserva/pago/garantía | Reservas, Reputación | RF07/RF20/RF22 | Alta |
| UI11 | E07: navegación inferior | Buscar / Publicar / Reservas / Perfil, con permisos por acción | Usuarios y módulos por sección | RF12; AC06; EQ-06 | Alta |
| UI12 | No se observó interpretación natural en Hygglo | IA como mejora propia, nunca inventa precios/IDs ni confirma operaciones | Búsqueda | RF16/RF17; EQ-02/EQ-10 | Alta |
| UI13 | Pago no observado | Culqi/Yape y estados pendientes/desconocidos son diseño propio | Reservas: pagos | RF09/RF21/RF22; EQ-08 | Alta |
| UI14 | T02/T05: entrada de contratación y fichas públicas; agenda/cotización operativas pendientes | Solicitud de oficio con alcance y fecha preferida; cotización y agenda según reglas Qatu | Reservas, Proveedores | RF06/RF23 | Alta |

## Decisiones que requieren especificación

| Decisión | Hallazgo | Tratamiento |
|---|---|---|
| Duración cobrable | E04 muestra cuatro días al seleccionar 17-20 | Definir días calendario o bloques de 24 h; no confundir con exclusión [inicio, fin) |
| Tarifas por duración | E03 ofrece referencias para varios periodos | Mantener tarifa diaria simple inicialmente o especificar paquetes explícitos; no inferir fórmula |
| Mínimo de alquiler | E03 informa tres días en ese objeto | Decidir si Qatu admite mínimo configurable; no imponerlo a todas las herramientas |
| Garantía | Hygglo muestra mensajes de protección | Qatu usa garantía documental sin custodia propia; no prometer cobertura equivalente |
| Reputación | E03 distingue reseñas del propietario | Mostrar a qué entidad pertenece una puntuación y su número de reseñas |
| Ubicación | E02 solicita zona antes de explorar | Permitir distrito manual y no bloquear navegación si falla mapa |

## Criterios de aceptación para el prototipo

1. Entrada natural muestra los filtros que interpretó y permite corregirlos.
2. Sin fechas, una tarjeta no afirma disponibilidad para un periodo determinado.
3. Antes de solicitar, el detalle muestra duración y total; garantía y comisión aparecen separadas.
4. Un proveedor sin verificación no presenta una insignia de verificado.
5. Móvil de 360-390 px permite buscar y acceder a reservas sin desplazamiento horizontal.
6. Un error de IA conserva la búsqueda convencional; un error de mapas permite elegir distrito.
7. Ninguna respuesta del frontend confirma el pago sin comprobación del backend.
8. Las reseñas se vinculan a una reserva finalizada y un participante real.

Estos criterios complementan el [análisis del sistema](../../README.md#analisis-del-sistema); no alteran automáticamente requisitos o ADR.

## Adaptaciones adicionales de Taskrabbit

| ID | Evidencia | Propuesta Qatu | Trazabilidad |
|---|---|---|---|
| UI15 | T01/T03: grupos y especialidades | Categorías de oficios locales, sin ampliar el MVP a todos los servicios del referente | RF01/RF03 |
| UI16 | T02: formulario con etapas y ubicación | Solicitud por pasos, revisión previa y distinción entre fecha preferida y confirmada | RF06/RF07/RF23 |
| UI17 | T05: reseñas, trabajos y descripción de profesionales | Separar datos calculados en Qatu, experiencia declarada y verificación documental | RF02/RF11/RF13 |
| UI18 | T05: descripciones con exclusiones y cargos | Cotización con alcance, materiales y cargos explícitos antes de aceptación/pago | RF09/RF23 |
| UI19 | T04: servicio en una columna móvil | Descripción legible y acción principal accesible; comprobar navegación propia | AC06; EQ-06 |

El precio, agenda, chat y checkout reales de Taskrabbit no fueron ejecutados. [Informe y límites](./04-analisis-taskrabbit.md).
