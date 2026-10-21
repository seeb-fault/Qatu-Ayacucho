# 007 — Búsqueda inteligente

**Estado:** especificado; implementación y aceptación pendientes. **Fecha:** 2026-10-15.
**Módulo técnico:** busqueda. **Historias:** HU01, HU15, HU16.

## Objetivo y alcance

Interpretar necesidades en lenguaje natural como filtros editables validados y consultar ofertas reales sin afectar las operaciones principales.

Interfaz prevista: Entrada natural, filtros interpretados/editables, aclaración y aviso de modo convencional sin pérdida de consulta.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Expresar una necesidad (P1)

Como cliente, quiero buscar con lenguaje natural.

**Prueba independiente:** Dado una consulta explícita de taladro/zona/presupuesto, cuando ejecuto búsqueda, entonces veo filtros editables y ofertas con IDs/precios reales.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Resolver ambigüedad (P1)

Como cliente, quiero corregir lo interpretado.

**Prueba independiente:** Dado una fecha relativa o categoría ambigua, cuando se interpreta la consulta, entonces se muestran campos que requieren precisión y prevalecen filtros manuales.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Buscar durante fallo de IA (P1)

Como visitante, quiero continuar sin IA.

**Prueba independiente:** Dado timeout, cuota o JSON inválido, cuando ejecuto búsqueda, entonces recibo modo convencional sin bloquear reservas ni pagos.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M007-FR01 | Salida del modelo es no confiable; validar esquema, límites e IDs contra catálogo y zonas reales. | RF01, RF16, RF17 |
| M007-FR02 | Filtros manuales tienen prioridad; fechas relativas con reloj inyectado/contexto America/Lima; ambigüedad se muestra, no se inventa. | RF01, RF16, RF17 |
| M007-FR03 | Modelo interpreta, backend consulta precio/disponibilidad. Sin SQL generado ni acciones de escritura. | RF01, RF16, RF17 |
| M007-FR04 | Interpretación máximo 3 s y solicitud total 5 s como metas; cortar llamadas al vencer deadline. | RF01, RF16, RF17 |
| M007-FR05 | 429, error, JSON inválido o cuota agotada activan búsqueda convencional; reservas/pagos no importan este módulo. | RF01, RF16, RF17 |
| M007-FR06 | No enviar documentos, pagos ni evidencia privada al modelo; no guardar texto sensible completo en logs. | RF01, RF16, RF17 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: configuración de cuota y métricas agregadas; sin copia autoritativa de catálogo. Identidad de actor derivada del servidor. Contratos entre módulos: BuscarEnLenguajeNatural; puerto InterpreteIntencion; consumo de ConsultaCatalogo y ConsultaDisponibilidad en modo lectura.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- EQ-02: 429/5xx/latencia/JSON inválido con reservas/pagos operativos.
- EQ-10: 50 consultas (30 explícitas,10 ambiguas,10 adversariales), fecha fija y etiquetas humanas.
- Meta >=90% filtros exactos explícitos y >=80% pertinente en primeros5; cero IDs/precios inventados/escrituras.
- Proveedor IA sustituible por doble sin modificar dominio; cuotas y límite 500 caracteres.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-01, EQ-02, EQ-05, EQ-10 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D10: proveedor/modelo, presupuesto mensual, cuota por actor y anonimato de métricas; pendiente antes de activar llamadas facturables.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

- [004-catalogo-publicaciones](../004-catalogo-publicaciones/spec.md).
- [005-reservas-contratacion-pagos](../005-reservas-contratacion-pagos/spec.md).

## Artifacts

[Plan](./plan.md) · [Investigación de decisiones](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).

## Fuentes

- [Historias de usuario](../../docs/01-analisis-de-sistema/02-historias-del-usuario.md).
- [Requisitos funcionales](../../docs/01-analisis-de-sistema/03-requisitos-funcionales.md).
- [Reglas RN01–RN12 y módulos](../../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).
- [Modelo lógico](../../docs/03-diseño-de-software/modelo-de-datos.md).
- [Contratos REST vigentes](../../docs/03-diseño-de-software/diseño-externo/contratos-api.md).
- [Escenarios EQ](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- [ADR](../../docs/01-analisis-de-sistema/07-desision-arquitectonica.md).
- [Constitución](../../.specify/memory/constitution.md).
