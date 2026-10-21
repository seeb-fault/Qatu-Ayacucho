# Transición de ingeniería inversa a SDD con Spec Kit

## Estado y propósito

El proyecto aplicará SDD con GitHub Spec Kit. Se integró Specify CLI 1.2.0 con infraestructura oficial .specify y skills Claude Code según RC13. Las ocho especificaciones, planes y tareas están en [specs/](../../specs/README.md), con [trazabilidad](../../specs/trazabilidad.md) y [decisiones pendientes](../../specs/decisiones-pendientes.md). Se implementó el prototipo de descubrimiento 001 con fixtures; los módulos de backend y las integraciones reales siguen pendientes; los planes con políticas abiertas siguen siendo borradores para las operaciones afectadas.

La evidencia externa informa el diseño; los requisitos Qatu y las decisiones arquitectónicas gobiernan la implementación. Las capturas de terceros se conservan como evidencia y no como recursos visuales del producto.

## Insumos que reutilizaremos

| Insumo | Uso en SDD |
|---|---|
| [Análisis del sistema](../../README.md#analisis-del-sistema) | Actores, HU, RF, restricciones y escenarios medibles |
| [Arquitectura](../../README.md#arquitectura-de-software) | Límites de módulos y decisiones vigentes |
| [Diseño](../../README.md#diseno-de-software) | Contratos, modelo de datos, estados y validación |
| [Modelo C4](../../README.md#modelo-c4) | Contexto y responsabilidades |
| [Matriz de adaptación](./02-matriz-adaptacion-qatu.md) | Patrones observados y criterios de interfaz |
| [Propuesta visual](./03-propuesta-interfaz-qatu.md) | Pantallas y estados a incluir en cada especificación |

## Principios que proponemos trasladar a la constitución

- Monolito modular con seis módulos: Usuarios, Proveedores, Catálogo, Reservas, Reputación y Búsqueda; pagos dentro de Reservas.
- Next.js/TypeScript, NestJS/TypeScript y PostgreSQL/PostGIS conforme a la arquitectura vigente; despliegue inicial Docker Compose en VPS.
- Reserva, pago y garantía mantienen estados distintos. El backend autoriza acciones y calcula importes.
- Aceptación y bloqueo de recurso/agenda son transaccionales; una solicitud pendiente no asegura disponibilidad.
- Pagos idempotentes, verificados en servidor y conciliables; sandbox real antes de declarar integrada la pasarela. Yape depende de la habilitación del proveedor de pagos.
- La IA transforma intención en filtros validados; no genera SQL ni inventa ofertas, precios o disponibilidad. Existe alternativa convencional.
- Cada entrega conserva trazabilidad HU/RF/EQ y evidencia de verificación acorde con el riesgo.

Los objetivos EQ existentes siguen siendo metas por medir, no resultados obtenidos.

## Primera entrega propuesta: descubrir y consultar ofertas

Un alcance pequeño y revisable: inicio, resultados y detalle para herramienta/oficio; filtros de tipo, categoría y distrito; estados de carga, vacío y error; adaptación móvil. Catálogo inicial con datos sintéticos identificados en el prototipo. Una demostración visual no cuenta como reservas, pagos ni IA funcionando.

Antes de escribir código: definir la especificación de esta entrega, sus criterios y el plan. El prototipo formará parte de esa entrega SDD, respetando el orden elegido por el usuario.

### Criterios iniciales para la especificación

1. Una búsqueda conserva y muestra sus filtros; el usuario puede corregirlos.
2. Las tarjetas distinguen alquiler por día y servicio sujeto a cotización; no afirman disponibilidad sin fechas verificadas.
3. El detalle muestra proveedor, distrito, alcance/condiciones y reputación con su cantidad de reseñas; no inventa verificaciones.
4. Sin coincidencias se permite cambiar filtros; un error de red permite reintentar sin borrar la consulta.
5. Se puede buscar y consultar detalles sin sesión; solicitar/publicar requiere autenticación en la entrega correspondiente.
6. A 390 px y en escritorio no hay desplazamiento horizontal del contenido principal; formulario operable con teclado y etiquetas accesibles.

## Organización vigente de especificaciones

Se conserva el recorrido web 001; se detallan los seis módulos en 002–007 y el despliegue en 008. La numeración y el orden de trabajo están en [el índice de specs](../../specs/README.md). Pagos continúa dentro de Reservas; administración sigue siendo una interfaz por permisos.

## Decisiones que se deben aclarar en su entrega

- Alquiler: días calendario o bloques de 24 h, horarios de retiro/devolución y mínimos. Separar cálculo comercial de intervalos [inicio, fin) para evitar conflictos.
- Oficios: precio fijo o cotización; materiales, movilidad, anticipo, vigencia y revisiones de cotización.
- Agenda: duración de atención, margen entre servicios y orden de aceptación de cotización/reserva.
- Comisión, cancelación, garantía documental e incidencias: importes/reglas mostrados antes de aceptar.
- Pago: disponibilidad sandbox del medio Yape, expiración y tratamiento de un pago aprobado tarde.

Resolver cada política antes de implementar el recorrido afectado; no necesitamos bloquear la pantalla inicial por decisiones exclusivas del checkout.

## Adopción de Spec Kit

La documentación oficial consultada el 15/10/2026 describe constitución una vez y, por entrega, especificación → plan → tareas → implementación → convergencia, con aclaraciones y análisis cuando correspondan. La sintaxis de invocación depende de la integración y versión instalada; se comprobará al preparar el entorno. No copiar comandos antiguos sin verificar.

Para un repositorio existente se debe partir de una base revisable y revisar el diff de inicialización, porque archivos administrados pueden coincidir con existentes. Conservaremos los documentos actuales como referencias y registraremos la ubicación real de los artefactos generados después de inicializar. El usuario conserva el control de sus commits y subida a GitHub.

Fuentes oficiales: [Spec Kit](https://github.com/github/spec-kit) y [adopción en proyectos existentes](https://github.github.io/spec-kit/guides/existing-projects.html).

## Condición de entrega terminada

Una especificación no termina por generar código: sus criterios deben verificarse, los fallos pendientes deben quedar resueltos o delimitados y los documentos deben coincidir con el comportamiento entregado. El siguiente paso será resolver las aclaraciones que afecten la primera implementación, analizar sus artefactos y ejecutar las tareas de esa especificación. Este archivo conserva el contexto de la transición.
