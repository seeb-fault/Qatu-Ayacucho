# 01 - Actores del sistema

## Objetivo

Identificar a los actores que interactúan directa o indirectamente con Qatu y determinar las principales actividades que necesitan realizar.

## Contexto del caso

En Ayacucho, quien necesita una herramienta para una obra o reparación suele comprarla aunque la use una sola vez, y quien busca un maestro de oficio depende de recomendaciones informales. Qatu es una plataforma donde los **proveedores** publican herramientas en alquiler y servicios de oficios, y los **clientes** los encuentran, los reservan o los contratan.

## Actores identificados

| Actor                           | ¿Qué necesita realizar?                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente**                     | Buscar herramientas y servicios, consultar información y disponibilidad, solicitar alquileres o contrataciones, pagar, consultar sus reservas y calificar. |
| **Proveedor**                   | Publicar herramientas en alquiler y servicios de oficios, gestionar su disponibilidad, aceptar o rechazar solicitudes y consultar sus reservas.      |
| **Administrador**               | Administrar y supervisar la plataforma, verificar proveedores y moderar publicaciones y reseñas.                                                     |
| **Pasarela de pago**            | Procesar pagos del alquiler o anticipos; la garantía del MVP se registra documentalmente.                                                                              |
| **Servicio de mensajería**      | Enviar notificaciones y mensajes (por ejemplo, WhatsApp o SMS) sobre el estado de las reservas.                                                      |
| **Servicio de mapas**           | Proporcionar geolocalización para ubicar proveedores y herramientas cercanas.                                                                        |

## Descripción de los actores

### 1. Cliente

Es el usuario que necesita una herramienta o un servicio. Puede buscar por categoría y zona, revisar el detalle y la disponibilidad, solicitar un alquiler o la contratación de un servicio, pagar, consultar el estado de sus reservas y calificar al proveedor.

### 2. Proveedor

Es el usuario que ofrece herramientas en alquiler (arrendador) o servicios de oficios (maestro, técnico). Registra y actualiza sus publicaciones, gestiona su calendario de disponibilidad y responde a las solicitudes de los clientes.

### 3. Administrador

Es el responsable de supervisar el funcionamiento de la plataforma: gestionar usuarios y proveedores, verificar su identidad y moderar publicaciones y reseñas.

### 4. Pasarela de pago

Sistema externo que procesa los pagos de los clientes (por ejemplo, tarjetas, Yape o Plin).

### 5. Servicio de mensajería

Sistema externo que envía notificaciones a clientes y proveedores cuando ocurre un evento relevante (solicitud, aceptación, recordatorio, entrega o devolución).

### 6. Servicio de mapas

Sistema externo que permite mostrar ubicaciones y calcular cercanía entre clientes y proveedores.

## Resumen

- **Actores principales:** Cliente, Proveedor y Administrador.
- **Actores externos:** Pasarela de pago, Servicio de mensajería y Servicio de mapas.

## Actores y condiciones añadidas para el MVP

| Actor | Responsabilidad y límites |
|---|---|
| Visitante | Consulta publicaciones y búsqueda natural; se autentica para reservar/pagar |
| Proveedor externo de IA | Interpreta texto; no accede a pagos, documentos privados ni operaciones de escritura |

Una cuenta puede tener roles de cliente y proveedor. Administrador opera sobre todos los módulos con permisos auditados. Culqi es la pasarela candidata; Yape es un medio de pago integrado, no un módulo ni confirmación manual equivalente a pasarela. La garantía se registra documentalmente sin custodia propia en el MVP.

[Vistas C4](../../README.md#modelo-c4).
