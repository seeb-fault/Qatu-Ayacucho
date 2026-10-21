# 03 - Requisitos Funcionales

## Objetivo

Identificar y documentar las funcionalidades que Qatu debe proporcionar a los diferentes actores, tomando como base las historias de usuario.

## Requisitos Funcionales

| ID       | Requisito Funcional                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| **RF01** | El sistema debe permitir buscar herramientas y servicios mediante criterios como categoría, zona y precio.           |
| **RF02** | El sistema debe permitir consultar el detalle, las tarifas y la disponibilidad de una herramienta o servicio.        |
| **RF03** | El sistema debe permitir registrar, actualizar y desactivar las publicaciones de herramientas y servicios.           |
| **RF04** | El sistema debe permitir gestionar el calendario de disponibilidad de las herramientas.                              |
| **RF05** | El sistema debe permitir generar una solicitud de alquiler de una herramienta indicando las fechas requeridas.       |
| **RF06** | El sistema debe permitir generar una solicitud de contratación de un servicio de oficio.                             |
| **RF07** | El sistema debe permitir al proveedor aceptar, rechazar o cancelar las solicitudes recibidas.                        |
| **RF08** | El sistema debe permitir consultar las reservas realizadas, su detalle y su estado.                                  |
| **RF09** | El sistema debe permitir procesar el pago de una reserva o anticipo mediante una pasarela externa (Culqi candidata, con Yape como medio habilitado), y verificar el resultado en el servidor.                   |
| **RF10** | El sistema debe permitir enviar notificaciones sobre los cambios de estado de las reservas.                          |
| **RF11** | El sistema debe permitir registrar calificaciones y reseñas de los proveedores.                                      |
| **RF12** | El sistema debe permitir registrar usuarios, autenticarlos y gestionar su perfil según su rol.                       |
| **RF13** | El sistema debe permitir registrar, verificar y desactivar proveedores de la plataforma.                             |
| **RF14** | El sistema debe permitir gestionar los usuarios registrados en la plataforma.                                        |
| **RF15** | El sistema debe permitir supervisar y moderar las publicaciones y reseñas registradas.                               |

## Relación entre Historias de Usuario y Requisitos Funcionales

| Historia de Usuario                             | Requisitos Funcionales Relacionados |
| ----------------------------------------------- | ----------------------------------- |
| **HU01 - Buscar herramientas y servicios**      | RF01, RF02                          |
| **HU02 - Gestionar publicaciones**              | RF03                                |
| **HU03 - Solicitar alquiler de herramienta**    | RF05, RF08                          |
| **HU04 - Contratar servicio de oficio**         | RF06, RF08                          |
| **HU05 - Responder solicitudes**                | RF07                                |
| **HU06 - Consultar reservas**                   | RF08                                |
| **HU07 - Realizar pago**                        | RF09                                |
| **HU08 - Gestionar disponibilidad**             | RF04                                |
| **HU09 - Recibir notificaciones**               | RF10                                |
| **HU10 - Calificar y reseñar**                  | RF11                                |
| **HU11 - Registro e inicio de sesión**          | RF12                                |
| **HU12 - Gestionar proveedores**                | RF13                                |
| **HU13 - Gestionar usuarios**                   | RF14                                |
| **HU14 - Supervisar publicaciones y reseñas**   | RF15                                |

## Trazabilidad

La relación entre historias de usuario y requisitos funcionales permite verificar que cada funcionalidad definida responde a una necesidad identificada durante el análisis. Cada requisito funcional se deriva de una o más historias de usuario.

## Requisitos adicionales del MVP

| ID | Requisito | Historia |
|---|---|---|
| RF16 | Interpretar texto natural en filtros validados de tipo, categoría, zona, presupuesto y fechas; mostrar filtros editables y resultados reales | HU15 |
| RF17 | Mantener búsqueda convencional ante fallo o cuota de IA, sin bloquear reservas/pagos | HU16 |
| RF18 | Registrar entrega, devolución o cierre del servicio, con transiciones autorizadas | HU17 |
| RF19 | Guardar evidencias con metadata y permisos por participante; moderación autorizada | HU17 |
| RF20 | Registrar garantía, condiciones e incidencias; separar garantía/comisión y no custodiar fondos propios | HU18 |
| RF21 | Persistir y verificar intentos/resultados de pago; deduplicar peticiones y eventos | HU19 |
| RF22 | Conciliar pagos pendientes/desconocidos y tardíos; registrar ajustes/reembolsos sin confirmar fechas ocupadas | HU19 |
| RF23 | Emitir y aceptar cotización de servicio variable antes de cobrar | HU20 |

RF04/RF05/RF07: disponibilidad por recurso físico/agenda; aceptación bloquea transaccionalmente y vence; solicitud pendiente no bloquea. RF11: reseña solo de reserva finalizada. RF09 es obligatorio; el adaptador simulado es para pruebas y no sustituye la integración sandbox.

[Contratos REST](../03-diseño-de-software/diseño-externo/contratos-api.md) · [Escenarios](./08-escenarios-atributos-calidad.md).
