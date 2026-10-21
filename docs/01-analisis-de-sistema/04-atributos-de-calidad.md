# 04 - Atributos de Calidad

## Objetivo

Determinar las características de calidad que debe cumplir Qatu, además de las funcionalidades que debe proporcionar.

## Escenario de Calidad

Durante épocas de alta demanda (por ejemplo, fines de semana largos, feriados o temporada de construcción y remodelación), Qatu podría recibir muchos usuarios consultando herramientas y servicios, y solicitando reservas de manera simultánea, en su mayoría desde celulares y con conectividad móvil variable.

Ante este escenario, el sistema debe mantener un funcionamiento adecuado, garantizando buen rendimiento, disponibilidad, escalabilidad, seguridad, usabilidad y facilidad de mantenimiento.

## Atributos de Calidad

| ID       | Atributo de Calidad | Escenario de Calidad                                                                                                                                         |
| -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AC01** | **Rendimiento**     | Las búsquedas y la consulta de disponibilidad deben responder rápidamente incluso cuando exista una alta cantidad de usuarios concurrentes.                  |
| **AC02** | **Disponibilidad**  | El sistema debe permanecer disponible durante los periodos de mayor demanda y permitir que los usuarios realicen sus reservas.                               |
| **AC03** | **Escalabilidad**   | El sistema debe poder soportar un incremento de usuarios, publicaciones y solicitudes sin afectar significativamente su funcionamiento.                      |
| **AC04** | **Seguridad**       | Los datos personales, las cuentas y los pagos deben estar protegidos frente a accesos no autorizados.                                                        |
| **AC05** | **Mantenibilidad**  | El sistema debe estar organizado de manera que permita realizar cambios y correcciones sin afectar innecesariamente otras funcionalidades.                   |
| **AC06** | **Usabilidad**      | La plataforma debe ser fácil de usar desde un celular, con pocos pasos para buscar y reservar, y debe funcionar de forma aceptable con conexiones lentas.     |

## Descripción de los Atributos

### AC01 - Rendimiento

Las búsquedas por categoría y zona, y la verificación de disponibilidad de una herramienta, deben ofrecer tiempos de respuesta adecuados aun con muchos usuarios simultáneos.

### AC02 - Disponibilidad

El sistema debe mantenerse operativo cuando más se usa, permitiendo buscar, reservar y pagar sin interrupciones importantes.

### AC03 - Escalabilidad

El sistema debe poder aumentar su capacidad cuando crezca la cantidad de usuarios, proveedores y publicaciones, evitando una degradación significativa del servicio.

### AC04 - Seguridad

El sistema debe proteger la información personal de clientes y proveedores y las operaciones de pago, controlando el acceso según el rol de cada usuario.

### AC05 - Mantenibilidad

El sistema debe tener una estructura modular que facilite la corrección de errores y la incorporación de nuevas funcionalidades (por ejemplo, nuevas categorías de servicios) sin afectar innecesariamente otros componentes.

### AC06 - Usabilidad

Gran parte de los usuarios accederá desde el celular. La interfaz debe ser simple, adaptarse a pantallas pequeñas y consumir pocos datos.

## Resumen

- **Rendimiento:** respuesta rápida en búsquedas y consulta de disponibilidad.
- **Disponibilidad:** funcionamiento continuo en periodos de alta demanda.
- **Escalabilidad:** capacidad para soportar el crecimiento de usuarios y publicaciones.
- **Seguridad:** protección de datos personales, cuentas y pagos.
- **Mantenibilidad:** facilidad para modificar y evolucionar el sistema.
- **Usabilidad:** uso sencillo desde celular y con conexiones lentas.

## Atributos adicionales y escenarios medibles

| ID | Atributo | Aplicación | Escenarios |
|---|---|---|---|
| AC07 | Resiliencia | IA/terceros fallan de forma controlada; pagos inciertos se concilian | EQ-02, EQ-08, EQ-10 |
| AC08 | Integridad | Sin solapamientos y sin efectos de pago duplicados | EQ-07, EQ-08 |
| AC09 | Recuperabilidad | Restaurar datos/archivos desde copias externas y conciliar pagos | EQ-09 |

AC01 se evalúa en EQ-01/EQ-10; AC02 en EQ-02/EQ-09; AC03 en EQ-03; AC04 en EQ-04; AC05 en EQ-05; AC06 en EQ-06. Las cifras están en [08 - Escenarios](./08-escenarios-atributos-calidad.md) y son metas pendientes de validar, no resultados.
