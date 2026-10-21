# 06 - Drivers Arquitectónicos

## Objetivo

Integrar los elementos identificados durante el análisis y determinar cuáles tienen una influencia significativa en las decisiones de arquitectura de Qatu.

## Criterio de selección

| Fuente              | Pregunta                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| Requisito funcional | ¿Esta funcionalidad requiere una decisión importante de arquitectura?        |
| Atributo de calidad | ¿Este atributo afecta la estructura o el funcionamiento de la arquitectura?  |
| Restricción         | ¿Esta condición limita o determina una decisión arquitectónica?              |

## Drivers Arquitectónicos Identificados

| ID       | Driver Arquitectónico                                                                                   | Origen                                                    | ¿Por qué influye en la arquitectura?                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **DA01** | El sistema debe soportar un incremento de usuarios en periodos de alta demanda.                         | **AC03 - Escalabilidad**                                  | Influye en la estrategia de escalamiento, distribución de carga y despliegue.                                                         |
| **DA02** | El sistema debe mantener tiempos de respuesta adecuados en búsquedas y consulta de disponibilidad.      | **AC01 - Rendimiento / RF01, RF02**                       | Influye en el almacenamiento, los índices de búsqueda, el uso de caché y el procesamiento de solicitudes.                              |
| **DA03** | El sistema debe proteger los datos personales y los pagos de los usuarios.                              | **AC04 - Seguridad / RC08, RC09**                         | Influye en autenticación, autorización por rol y protección de datos.                                                                 |
| **DA04** | El sistema debe integrarse con una pasarela de pago externa mediante una API.                           | **RC04 - Pasarela de pago / RF09**                        | Condiciona la integración con servicios externos y el manejo de transacciones y errores.                                              |
| **DA05** | El sistema debe usar una API REST entre frontend y backend.                                             | **RC03 - API REST**                                       | Limita las alternativas de comunicación y establece una forma estándar de interacción.                                                |
| **DA06** | El sistema debe integrarse con servicios externos de mensajería y mapas.                                | **RC05, RC06 / RF10**                                     | Influye en las interfaces de integración, el manejo de errores y la dependencia de la disponibilidad de terceros.                     |
| **DA07** | El sistema debe mantener una estructura modular que facilite su evolución.                              | **AC05 - Mantenibilidad / RC11, RC13**                    | Influye en la separación de responsabilidades y en la facilidad de incorporar cambios sin afectar otras partes.                       |
| **DA08** | El sistema debe evitar reservas en conflicto (una herramienta no puede alquilarse dos veces en las mismas fechas). | **RF04, RF05, RF07 / AC01**                               | Influye en el diseño del módulo de reservas y disponibilidad, y en el control de concurrencia sobre los datos.                        |
| **DA09** | El sistema debe ser usable desde celulares con conexiones lentas.                                       | **AC06 - Usabilidad / RC01, RC10**                        | Influye en el diseño de la presentación (mobile-first, carga ligera) y en el volumen de datos transferidos por la API.               |

## Descripción de los Drivers

### DA01 - Escalabilidad

Influye en cómo se despliega y escala el sistema cuando crece el número de usuarios.

### DA02 - Rendimiento

Las búsquedas y la consulta de disponibilidad son las operaciones más frecuentes. Pueden requerir índices, caché y consultas optimizadas.

### DA03 - Seguridad

Define cómo se autentica a los usuarios, cómo se restringe el acceso por rol y cómo se protegen los datos personales y de pago.

### DA04 - Integración con pasarela de pago

Los pagos se delegan a un tercero. La arquitectura debe contemplar solicitudes, respuestas, confirmaciones y fallos.

### DA05 - API REST

La API REST es el punto de contacto entre la interfaz y la lógica del sistema.

### DA06 - Integración con mensajería y mapas

Las notificaciones y la geolocalización dependen de servicios externos, por lo que debe manejarse su indisponibilidad sin detener la operación principal.

### DA07 - Modularidad y mantenibilidad

Los seis módulos (usuarios, proveedores, catálogo, reservas, reseñas y búsqueda inteligente) deben estar separados para evolucionar de forma independiente.

### DA08 - Consistencia en las reservas

Es el driver propio del dominio de Qatu: el alquiler depende de la disponibilidad por fechas, y dos clientes no pueden reservar el mismo recurso en el mismo periodo.

### DA09 - Usabilidad móvil

La mayoría de los accesos será desde celular, lo que condiciona la capa de presentación y el tamaño de las respuestas de la API.

## Resumen

Los principales drivers de Qatu son:

- **Escalabilidad** y **rendimiento** en periodos de alta demanda.
- **Seguridad** de datos personales y pagos.
- **Integración con servicios externos** (pagos, mensajería, mapas).
- **API REST** como forma de comunicación.
- **Modularidad y mantenibilidad.**
- **Consistencia de reservas** por fechas.
- **Usabilidad móvil.**

Estos drivers sirven de base para justificar las decisiones arquitectónicas de la siguiente etapa.

## Drivers añadidos y medidas

| ID | Driver | Origen | Impacto arquitectónico | Escenarios |
|---|---|---|---|---|
| DA10 | Interpretar búsqueda natural con límites, respaldo y datos reales | RF16, RF17; AC07; RC17, RC19 | Puerto de IA de lectura, validador y presupuesto de consumo | EQ-02, EQ-05, EQ-10 |
| DA11 | Operar y recuperar en VPS económico | AC09; RC14, RC16, RC19 | Persistencia, copias externas, health y medición de recursos | EQ-03, EQ-09 |
| DA12 | Confirmar pagos sin duplicados ni estados ficticios | RF09, RF21, RF22; AC08; RC04 | Intento persistido, deduplicación, verificación y conciliación | EQ-08 |
| DA13 | Documentar entrega/devolución y confianza | RF18-RF20; AC04; RC18 | Archivos privados, auditoría y estados de garantía independientes | EQ-04, EQ-09 |

DA08 pertenece principalmente a integridad AC08; rendimiento no sustituye consistencia. DA04 mantiene integración obligatoria de pasarela y DA12 define su fiabilidad. [ADR](./07-desision-arquitectonica.md) · [Escenarios](./08-escenarios-atributos-calidad.md).
