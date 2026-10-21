# 004 — Catálogo y publicaciones

**Estado:** especificado; implementación y aceptación pendientes. **Fecha:** 2026-10-15.
**Módulo técnico:** catalogo. **Historias:** HU01, HU02.

## Objetivo y alcance

Publicar herramientas y oficios, describir recursos y tarifas y exponer búsqueda paginada y detalle público de ofertas activas.

Interfaz prevista: Editor de publicación, gestión de unidades, listado/detalle y moderación; el recorrido visual se concreta en entrega 001.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Gestionar oferta (P1)

Como proveedor, quiero publicar y editar mi oferta.

**Prueba independiente:** Dado un proveedor verificado, cuando creo herramienta o servicio con tarifa y recurso, entonces se guarda una oferta propia coherente.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Explorar catálogo (P1)

Como visitante, quiero encontrar ofertas por zona y presupuesto.

**Prueba independiente:** Dado ofertas activas e inactivas, cuando aplico filtros y abro detalle, entonces solo se muestran las activas y el precio conserva su unidad.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Moderar publicación (P1)

Como administrador, quiero retirar contenido indebido.

**Prueba independiente:** Dado una publicación denunciada o revisada, cuando la desactivo con motivo, entonces deja de aparecer sin borrar historial de reservas.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M004-FR01 | Proveedor activo/verificado para publicar; validar propietario también al editar. | RF01, RF02, RF03, RF15 |
| M004-FR02 | Cada unidad física tiene recursoId estable; el servicio referencia una agenda. Catálogo describe y Reservas bloquea. | RF01, RF02, RF03, RF15 |
| M004-FR03 | Tipo herramienta/servicio y categoría compatibles; importes enteros en céntimos PEN y unidad explícita. | RF01, RF02, RF03, RF15 |
| M004-FR04 | Solo publicaciones activas se descubren públicamente; cambios no reescriben snapshots previos de reserva. | RF01, RF02, RF03, RF15 |
| M004-FR05 | Búsqueda textual y filtros/indexación antes de Redis; no se crean embeddings obligatorios. | RF01, RF02, RF03, RF15 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: publicaciones; categorias; recursos; tarifas. Identidad de actor derivada del servidor. Contratos entre módulos: ConsultaCatalogo: ofertas activas, recurso estable y datos de tarifa para snapshot. No autoriza reservas ni escribe bloqueos.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- Proveedor no verificado y edición ajena rechazados.
- Datos persistidos: filtro tipo/categoría/zona/precio, límite 20 y orden estable sin duplicados.
- Desactivar entre listado/detalle, recurso multiu­nidad y precio inválido.
- EQ-01 y EQ-03 con dataset/condiciones del documento; no reportar cumplimiento antes de medir.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-01, EQ-03, EQ-04, EQ-06 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D04: búsqueda textual y contrato de filtros/orden/paginación; propuesta en contratos de esta entrega, revisar antes de congelar API.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

- [003-proveedores-verificacion](../003-proveedores-verificacion/spec.md).

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
