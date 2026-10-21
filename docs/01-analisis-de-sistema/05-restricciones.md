# 05 - Restricciones

## Objetivo

Identificar las restricciones que condicionan las decisiones de diseño, desarrollo y arquitectura de Qatu.

## Restricciones identificadas

| ID       | Restricción                       | Descripción                                                                                                                                                  |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RC01** | **Aplicación web**                | El sistema debe desarrollarse como una aplicación web accesible desde el navegador, con diseño adaptable a celulares (mobile-first).                         |
| **RC02** | **Control de versiones**          | El código fuente debe gestionarse con Git y mantenerse en un repositorio compartido en GitHub.                                                               |
| **RC03** | **API REST**                      | La comunicación entre el frontend y los servicios del sistema debe realizarse mediante una API REST.                                                         |
| **RC04** | **Pasarela de pago**              | El MVP debe integrar una pasarela externa: Culqi candidata y Yape como medio habilitado. La confirmación se verifica en backend; sandbox obligatorio antes de producción.                                        |
| **RC05** | **Servicio de mensajería**        | El sistema debe integrarse con un servicio externo de mensajería (WhatsApp o SMS) para enviar notificaciones.                                                |
| **RC06** | **Servicio de mapas**             | El sistema debe integrarse con un servicio externo de mapas para la ubicación y cercanía de proveedores.                                                     |
| **RC07** | **Base de datos relacional**      | La información de usuarios, publicaciones, reservas, pagos y reseñas debe almacenarse en un sistema gestor de base de datos relacional.                      |
| **RC08** | **Seguridad de acceso**           | El sistema debe implementar autenticación y autorización para diferenciar los permisos de clientes, proveedores y administradores.                           |
| **RC09** | **Protección de datos personales**| El tratamiento de datos personales debe respetar la normativa peruana de protección de datos personales (Ley N.° 29733).                                      |
| **RC10** | **Compatibilidad web**            | La aplicación debe funcionar en los principales navegadores, especialmente los de celulares.                                                                 |
| **RC11** | **Arquitectura modular**          | La solución debe organizarse de manera modular para facilitar su mantenimiento y evolución.                                                                  |
| **RC12** | **Alcance funcional**             | El sistema solo gestiona alquiler de herramientas y servicios de oficios; no incluye compraventa de productos.                                               |
| **RC13** | **Desarrollo guiado por especificaciones** | El desarrollo se realizará con Claude Code aplicando spec-driven development con GitHub Spec Kit, por lo que los requisitos deben quedar documentados y trazables. |
| **RC14** | **Presupuesto limitado**          | La infraestructura inicial debe tener bajo costo, usando servicios con planes gratuitos o económicos.                                                        |

## Descripción de las Restricciones

### RC01 - Aplicación web

Qatu debe ser accesible desde un navegador sin instalar nada. Como la mayoría de usuarios usará celular, el diseño debe priorizar pantallas pequeñas.

### RC02 - Control de versiones

El código y la documentación se versionan con Git y se publican en GitHub.

### RC03 - API REST

El frontend se comunica con el backend exclusivamente mediante una API REST, lo que separa la interfaz de la lógica del sistema.

### RC04 - Pasarela de pago

Los pagos no se procesan directamente en Qatu. Se delegan a una pasarela externa, lo que evita almacenar datos sensibles de tarjetas.

### RC05 - Servicio de mensajería

Las notificaciones sobre reservas se envían por un canal externo, de uso común entre los usuarios de la zona.

### RC06 - Servicio de mapas

La ubicación y cercanía se resuelven con un servicio externo de mapas.

### RC07 - Base de datos relacional

Los datos de Qatu tienen relaciones claras (usuarios, publicaciones, reservas, pagos, reseñas), por lo que se requiere una base de datos relacional.

### RC08 - Seguridad de acceso

Cada rol (cliente, proveedor, administrador) solo puede acceder a las funciones que le corresponden.

### RC09 - Protección de datos personales

Se manejan datos como nombres, teléfonos, ubicación y documentos de verificación, que deben tratarse conforme a la ley peruana.

### RC10 - Compatibilidad web

El sistema debe funcionar correctamente en los navegadores más usados en celulares y computadoras.

### RC11 - Arquitectura modular

Los componentes deben estar separados para modificarlos sin generar dependencias innecesarias.

### RC12 - Alcance funcional

Qatu cubre alquiler de herramientas y servicios de oficios (pintor, gasfitero, jardinero, electricista, etc.). La venta de productos queda fuera de alcance.

### RC13 - Desarrollo guiado por especificaciones

El proyecto se construirá con Claude Code y GitHub Spec Kit, por lo que este análisis sirve de insumo para las especificaciones.

### RC14 - Presupuesto limitado

El costo de infraestructura debe ser bajo en la etapa inicial, con posibilidad de crecer luego.

## Resumen

Las restricciones condicionan principalmente:

- Aplicación web mobile-first y compatibilidad de navegadores.
- Control de versiones y desarrollo guiado por especificaciones.
- Comunicación mediante API REST.
- Integración con pagos, mensajería y mapas.
- Base de datos relacional.
- Seguridad, control de acceso y protección de datos personales.
- Modularidad, alcance definido y presupuesto limitado.

## Restricciones adicionales para la entrega

| ID | Restricción | Consecuencia |
|---|---|---|
| RC15 | Entrega a fines de noviembre de 2026; día exacto pendiente | Priorizar recorrido completo de herramientas/oficios |
| RC16 | Despliegue inicial en un VPS con Docker Compose | Un backend, persistencia y copias externas; no prometer alta disponibilidad |
| RC17 | IA limitada a búsqueda natural del MVP | Adaptador externo, cuota y deadline; no ejecutar pagos/reservas mediante IA |
| RC18 | Sin custodia propia de garantías | Registrar monto/condiciones/evidencias; pago del alquiler separado |
| RC19 | Presupuesto de VPS e IA pendiente de fijar | Medir costo por consulta, límites mensuales y carga antes de dimensionar |

Compraventa, ERP, courier, custodia avanzada, recomendador personalizado y app móvil nativa quedan como evolución. RC04 sigue siendo obligatorio: no sustituir pasarela por comprobante manual. RC13 conserva la herramienta de desarrollo documentada, sin introducirla como dependencia del producto desplegado.
