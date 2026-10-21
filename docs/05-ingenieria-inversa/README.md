# 05 - Ingeniería inversa funcional y visual de Qatu

## Etapas: Hygglo y Taskrabbit

Investigación realizada el 15 de octubre de 2026 (America/Lima) mediante REA 6.5.0. Se eligió Hygglo UK por su semejanza con el alquiler entre personas. Hygglo estudia descubrimiento, detalle y selección de fechas; Taskrabbit aporta servicios, fichas públicas e inicio de contratación. La investigación no constituye ingeniería inversa del backend ni un clon de la plataforma.

## Entregables

1. [Análisis de Hygglo](./01-analisis-hygglo.md): observaciones, capturas, acciones y límites.
2. [Matriz de adaptación a Qatu](./02-matriz-adaptacion-qatu.md): decisiones propuestas y trazabilidad.
3. [Propuesta de interfaz Qatu](./03-propuesta-interfaz-qatu.md): pantallas, componentes y criterios para el prototipo.
4. [Análisis de Taskrabbit](./04-analisis-taskrabbit.md): cinco escenarios públicos, adaptaciones y límites.
5. [Transición a SDD con Spec Kit](./05-transicion-sdd-spec-kit.md): principios, entregas y decisiones pendientes.
6. [Evidencias REA](./evidencias/README.md): doce capturas en total, manifiestos y registros completos.

## Estado de las preguntas

| Pregunta | Estado | Evidencia |
|---|---|---|
| ¿Cómo se organiza la portada? | Observada en escritorio y móvil | E01, E05, E07 |
| ¿Cómo se inicia la búsqueda y se presentan resultados? | Observada; ubicación se cerró sin cambiarla | E02, E06 |
| ¿Qué contiene el detalle de un objeto? | Observado en una escalera de uso doméstico | E03 |
| ¿Qué cambia al elegir fechas? | Observado en un rango y una publicación | E04 |
| ¿Cómo se comporta el pago y la aprobación? | Pendiente de observación | No se enviaron solicitudes ni pagos |
| ¿Cómo funciona la publicación o el panel de proveedor? | Pendiente | No se inició sesión |
| ¿Cómo se contrata un oficio? | Parcial: fichas y primera etapa observadas; agenda, cotización y checkout sin ejecutar | Taskrabbit T01-T05 |
| ¿Cómo diseña Airbnb su experiencia? | Pendiente | No se examinó Airbnb en esta etapa |

## Criterio de evidencia

Observación: captura o cambio ejecutado por REA. Inferencia: explicación tentativa, marcada explícitamente. Propuesta: decisión para Qatu, todavía sin implementación. El registro no convierte mensajes promocionales de terceros en garantías del producto Qatu.

Se mantienen los seis módulos actuales, NestJS, Next.js, PostgreSQL, IA de búsqueda y pasarela Culqi/Yape como diseño propio. [Arquitectura vigente](../../README.md#arquitectura-de-software).

## Especificaciones separadas

Las entregas de implementación se organizan en [specs/](../../specs/README.md). Esta carpeta conserva la investigación y sus evidencias.
