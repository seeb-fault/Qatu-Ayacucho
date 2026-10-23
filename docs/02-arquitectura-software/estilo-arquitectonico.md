# Estilo arquitectónico de Qatu

## Diagrama del estilo arquitectónico

Adaptación a Qatu Ayacucho del esquema de monolito modular en capas utilizado en clase. Esta vista explica la estructura global y las llamadas en ejecución, no la dirección de los imports. Las dependencias de código se explican en [Clean Architecture](./enfoque-arquitectonico.md).

![Qatu Ayacucho: actores, web Next.js, API NestJS con seis módulos, PostgreSQL e integraciones pendientes](./diagramas/png/estilo-arquitectonico-qatu.png)

[PNG](./diagramas/png/estilo-arquitectonico-qatu.png) · [SVG vectorial](./diagramas/svg/estilo-arquitectonico-qatu.svg) · [Editable en diagrams.net](./diagramas/fuentes/estilo-arquitectonico-qatu.drawio).

Para ampliar, abrir el SVG o PNG. Para editar, usar diagrams.net → Archivo → Abrir desde → Dispositivo y seleccionar el archivo `.drawio`. Exportación reproducible y guía de lectura: [diagramas/README.md](./diagramas/README.md).

## Alcance: diseñado frente a implementado

La figura representa la arquitectura objetivo, no seis módulos ya construidos. Usuarios y Proveedores están implementados en la API; Catálogo, Reservas, Reseñas y Búsqueda están diseñados y pendientes de implementación. La entrega 001 permite descubrir ofertas sintéticas en el frontend y no equivale al módulo Catálogo persistente.

| Elemento de la figura | Responsabilidad | Estado |
|---|---|---|
| Web Next.js | Interfaz para visitante, cliente, proveedor y administrador | Descubrimiento sintético, acceso y proveedores implementados |
| Usuarios | Cuentas, roles, sesiones y administración | Implementado |
| Proveedores | Perfil, zona, consulta pública y verificación privada | Implementado |
| Catálogo | Publicaciones, recursos, filtros y tarifas | Diseñado; entrega 004 pendiente |
| Reservas | Solicitudes, bloqueos, estados y pagos | Diseñado; pagos es componente de este módulo |
| Reseñas y confianza | Reseñas, incidencias y evidencias | Diseñado |
| Búsqueda | Interpretación de intención y filtros validados | Diseñado; proveedor de IA pendiente de selección |
| PostgreSQL 17 + PostGIS 3.5 | Persistencia relacional y restricciones | Base local en Docker; tablas de Usuarios y Proveedores implementadas |
| Pasarela, IA, mapas y mensajería | Capacidades externas mediante adaptadores | Integraciones pendientes; Culqi es candidata, no integración activa |

Redis no está implementado ni es un requisito para arrancar esta solución. Localmente solo la base de datos corre en Docker; web y API se ejecutan con npm. El VPS, HTTPS y el despliegue completo mediante Compose siguen siendo diseño de producción, no infraestructura ya publicada.

## Recorrido para explicar el diagrama

1. Los actores utilizan la web; esta se comunica con la API mediante HTTP/JSON y el contrato `/api/v1`.
2. La entrada HTTP valida solicitudes y aplica los controles de acceso. Los casos de uso también verifican permisos y reglas; no se confía solo en el controlador.
3. Las columnas son módulos de negocio, no servidores independientes. La fila de negocio agrupa Aplicación y Dominio para simplificar la vista global.
4. Cada módulo usa contratos internos para persistencia e integraciones. Una llamada en ejecución hacia infraestructura no significa que el dominio importe esa implementación.
5. Los módulos comparten PostgreSQL, pero conservan repositorios y propiedad de tablas. La comunicación interna se hace mediante contratos públicos, sin HTTP entre módulos del mismo proceso.
6. Las integraciones externas discontinuas son futuras. Búsqueda será quien interprete consultas mediante IA; Reservas será quien coordine la pasarela. No hay carrito, courier ni un módulo de pagos independiente heredado del ejemplo Marketplace.

Las flechas verticales muestran un recorrido representativo; no significan que toda consulta invoque una pasarela o que el dominio ejecute SQL. El diagrama de enfoque aclara la inversión de dependencias.

## Selección

Cliente-servidor + monolito modular. Frontend Next.js y API NestJS son aplicaciones separadas; en la arquitectura objetivo los seis módulos backend se publican juntos. Capas son organización lógica y contenedores C4 son aplicaciones/almacenes, no equivalentes a módulos ni necesariamente a contenedores Docker. Una clase llamada servicio no convierte el sistema en SOA o microservicios.

## Justificación

| Driver | Respuesta del estilo |
|---|---|
| DA01/DA11 | Backend único económico; optimización y dimensionamiento medidos antes de réplicas |
| DA02 | PostgreSQL indexado y paginación; caché opcional |
| DA03 | Autenticación, roles, propiedad, HTTPS y datos privados |
| DA04/DA12 | Componente de pagos dentro de Reservas, adapter y confirmación fiable |
| DA05 | Contrato REST /api/v1 entre web/API |
| DA06 | Integraciones por puertos, avisos durables y degradación controlada |
| DA07 | Seis módulos con API pública y Clean Architecture interna |
| DA08 | Transacciones y exclusión por recurso/rango |
| DA09 | Interfaz móvil, imágenes optimizadas y filtros editables |
| DA10 | Búsqueda depende de lectura de Catálogo/Reservas; operaciones no dependen de IA |
| DA13 | Confianza y archivos privados separados del pago del alquiler |

## Alternativas

Microservicios implican redes, despliegues, observabilidad y consistencia distribuida adicionales; se postergan hasta una necesidad medida. SOA/ESB no responde al tamaño actual. Eventos se usan para soporte durable, sin convertir toda la solución en event sourcing. Serverless no se elige para el VPS requerido; no se afirma que sea incapaz de hacer transacciones.

## Reglas

1. Dominio y casos de uso dependen de contratos internos, no de SDK/ORM.
2. Un módulo no consulta tablas/repositories ajenos.
3. Fachadas públicas devuelven DTO estables.
4. Módulos comparten proceso, recursos y despliegue; modularidad no garantiza aislamiento de fallos de proceso.
5. No mantener transacción abierta durante una llamada a pasarela/IA.
6. Vencimiento, cancelación y confirmación actualizan bloqueos atómicamente.
7. Eventos outbox se guardan con cambio de negocio; publicación después del commit.

## Vistas

[Resumen vigente](./arquitectura-inicial.md), [C4 componentes](../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md) y [VPS](../04-modelo-c4/despliegue-vps.md). Los diagramas anteriores de cinco módulos son históricos.

## Resumen para exposición

> Qatu sigue cliente-servidor con un backend monolítico modular. Los módulos separan responsabilidades, pero comparten proceso y despliegue. Elegimos esta estructura para mantener bajo el costo operativo y evitar la complejidad distribuida mientras no exista una necesidad medida. Clean Architecture organiza las dependencias dentro de los módulos; no reemplaza este estilo global.
