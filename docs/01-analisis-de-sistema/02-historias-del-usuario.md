# 02 - Historias de Usuario

## Objetivo

Describir las principales necesidades de los usuarios que interactúan con Qatu.

Las historias de usuario se expresan con el siguiente formato:

> Como [actor], quiero [acción], para [beneficio].

## Historias de Usuario

| ID       | Historia de Usuario                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **HU01** | Como cliente, quiero buscar herramientas y servicios por categoría, zona y precio, para encontrar rápidamente lo que necesito.              |
| **HU02** | Como proveedor, quiero publicar y gestionar mis herramientas y servicios, para ofrecerlos a los clientes.                                   |
| **HU03** | Como cliente, quiero solicitar el alquiler de una herramienta para unas fechas determinadas, para disponer de ella sin tener que comprarla. |
| **HU04** | Como cliente, quiero solicitar la contratación de un servicio de oficio, para resolver una necesidad en mi hogar u obra.                    |
| **HU05** | Como proveedor, quiero aceptar o rechazar las solicitudes que recibo, para controlar mi disponibilidad y mi trabajo.                        |
| **HU06** | Como cliente, quiero consultar mis reservas y su estado, para saber en qué punto se encuentra cada alquiler o servicio.                     |
| **HU07** | Como cliente, quiero pagar mi reserva o anticipo en línea, para asegurar el alquiler o el servicio.                                         |
| **HU08** | Como proveedor, quiero gestionar el calendario de disponibilidad de mis herramientas, para evitar reservas que no pueda cumplir.            |
| **HU09** | Como cliente y proveedor, quiero recibir notificaciones sobre mis reservas, para estar informado de cada cambio.                            |
| **HU10** | Como cliente, quiero calificar y dejar una reseña del proveedor, para ayudar a otros usuarios a elegir con confianza.                       |
| **HU11** | Como usuario, quiero registrarme e iniciar sesión, para acceder a las funciones de la plataforma según mi rol.                              |
| **HU12** | Como administrador, quiero verificar y gestionar a los proveedores, para garantizar la confianza en la plataforma.                          |
| **HU13** | Como administrador, quiero gestionar los usuarios de la plataforma, para mantener control sobre los usuarios registrados.                  |
| **HU14** | Como administrador, quiero supervisar las publicaciones y reseñas, para mantener una oferta confiable y de calidad.                         |

## Detalle de las Historias de Usuario

### HU01 - Buscar herramientas y servicios

**Como** cliente,  
**quiero** buscar herramientas y servicios por categoría, zona y precio,  
**para** encontrar rápidamente lo que necesito.

### HU02 - Gestionar publicaciones

**Como** proveedor,  
**quiero** publicar y gestionar mis herramientas y servicios,  
**para** ofrecerlos a los clientes.

### HU03 - Solicitar alquiler de herramienta

**Como** cliente,  
**quiero** solicitar el alquiler de una herramienta para unas fechas determinadas,  
**para** disponer de ella sin tener que comprarla.

### HU04 - Contratar servicio de oficio

**Como** cliente,  
**quiero** solicitar la contratación de un servicio de oficio,  
**para** resolver una necesidad en mi hogar u obra.

### HU05 - Responder solicitudes

**Como** proveedor,  
**quiero** aceptar o rechazar las solicitudes que recibo,  
**para** controlar mi disponibilidad y mi trabajo.

### HU06 - Consultar reservas

**Como** cliente,  
**quiero** consultar mis reservas y su estado,  
**para** saber en qué punto se encuentra cada alquiler o servicio.

### HU07 - Realizar pago

**Como** cliente,  
**quiero** pagar mi reserva o anticipo en línea,  
**para** asegurar el alquiler o el servicio.

### HU08 - Gestionar disponibilidad

**Como** proveedor,  
**quiero** gestionar el calendario de disponibilidad de mis herramientas,  
**para** evitar reservas que no pueda cumplir.

### HU09 - Recibir notificaciones

**Como** cliente y proveedor,  
**quiero** recibir notificaciones sobre mis reservas,  
**para** estar informado de cada cambio.

### HU10 - Calificar y reseñar

**Como** cliente,  
**quiero** calificar y dejar una reseña del proveedor,  
**para** ayudar a otros usuarios a elegir con confianza.

### HU11 - Registro e inicio de sesión

**Como** usuario,  
**quiero** registrarme e iniciar sesión,  
**para** acceder a las funciones de la plataforma según mi rol.

### HU12 - Gestionar proveedores

**Como** administrador,  
**quiero** verificar y gestionar a los proveedores,  
**para** garantizar la confianza en la plataforma.

### HU13 - Gestionar usuarios

**Como** administrador,  
**quiero** gestionar los usuarios de la plataforma,  
**para** mantener control sobre los usuarios registrados.

### HU14 - Supervisar publicaciones y reseñas

**Como** administrador,  
**quiero** supervisar las publicaciones y reseñas,  
**para** mantener una oferta confiable y de calidad.

## Historias añadidas: IA, confianza y pagos

| ID | Historia | Criterios de aceptación | Requisitos |
|---|---|---|---|
| HU15 | Como cliente, quiero buscar en lenguaje natural para expresar mi necesidad | Filtros visibles/editables; ofertas reales; ambigüedad explícita; no crea reservas | RF16 |
| HU16 | Como cliente, quiero seguir buscando cuando falle IA | Modo convencional disponible; timeout controlado; reserva/pago independientes | RF17 |
| HU17 | Como cliente/proveedor, quiero registrar entrega y devolución | Etapa, fecha, participantes y evidencia privada; transición autorizada | RF18, RF19 |
| HU18 | Como participante, quiero registrar condiciones de garantía e incidencias | Monto separado sin comisión; sin custodia propia; revisión humana | RF20 |
| HU19 | Como cliente, quiero conocer el resultado verificado de mi pago | Idempotencia; rechazo/pendiente/desconocido visibles; no confirma por pantalla del checkout | RF09, RF21, RF22 |
| HU20 | Como cliente, quiero aceptar una cotización antes de contratar un oficio de precio variable | Proveedor cotiza; cliente acepta; snapshot de importe anterior al pago | RF23 |

## Criterios críticos de historias existentes

HU03/HU05/HU08: dos aceptaciones concurrentes de un recurso y rango solo permiten una; pendientes no bloquean y aceptación tiene vencimiento. HU07: pagar con pasarela, incluidos medios habilitados como Yape, sin enviar datos de tarjeta al backend. HU10: reseña solo de reserva finalizada y participante real. HU11-HU14: verificar rol y propiedad, no solo sesión.

[Reglas del negocio](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).
