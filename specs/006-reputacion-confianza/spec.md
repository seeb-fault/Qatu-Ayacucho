# 006 — Reputación y confianza

**Estado:** especificado; implementación y aceptación pendientes. **Fecha:** 2026-10-15.
**Módulo técnico:** resenas. **Historias:** HU10, HU14, HU17, HU18.

## Objetivo y alcance

Documentar entrega/devolución y garantías, gestionar incidencias con revisión humana y publicar reseñas válidas de operaciones terminadas.

Interfaz prevista: Hitos y evidencias privadas en reserva, garantía documental, incidencias, formulario de reseña y moderación.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Registrar evidencia (P1)

Como participante, quiero documentar una entrega o devolución.

**Prueba independiente:** Dado mi reserva en etapa permitida, cuando subo evidencia válida, entonces se guarda privada con metadata y solo los autorizados la descargan.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Calificar operación (P1)

Como cliente, quiero reseñar un servicio terminado.

**Prueba independiente:** Dado mi reserva finalizada sin reseña previa, cuando califico de 1 a 5, entonces se registra una reseña única y se actualiza la reputación publicada.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Registrar garantía e incidencia (P1)

Como participante, quiero documentar condiciones y reclamar un problema.

**Prueba independiente:** Dado un acuerdo de garantía, cuando reporto incidencia, entonces se conserva historial para revisión humana sin simular custodia.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M006-FR01 | Nombre técnico resenas; no crear séptimo módulo para confianza. | RF11, RF15, RF18, RF19, RF20 |
| M006-FR02 | Reseña de cliente participante con reserva FINALIZADA; única por cliente/reserva y puntuación 1–5. | RF11, RF15, RF18, RF19, RF20 |
| M006-FR03 | Archivos privados con etapa, autor, hash, fecha y tamaño; referencia a reserva válida y permisos en descarga. | RF11, RF15, RF18, RF19, RF20 |
| M006-FR04 | Garantía documental separada del cobro; estado no acredita custodia ni transferencia bancaria. | RF11, RF15, RF18, RF19, RF20 |
| M006-FR05 | Incidencias se resuelven por humano autorizado; la IA de búsqueda no califica daños. | RF11, RF15, RF18, RF19, RF20 |
| M006-FR06 | Reservas decide estados de operación; Reputación consulta contratos/eventos y no modifica tablas de Reservas. | RF11, RF15, RF18, RF19, RF20 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: resenas; garantias_documentadas; evidencias; incidencias. Identidad de actor derivada del servidor. Contratos entre módulos: RegistroConfianza y lectura de reputación; ConsultaReservas para participantes/estado; almacén privado por adapter.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- Reseña ajena/anticipada/duplicada y puntuación inválida rechazadas; duplicado concurrente único.
- Descargas de evidencia ajena y archivos inválidos rechazados; hashes y referencias verificables.
- Moderación conserva auditoría y recalcula agregados sin reseñas ocultas.
- Restaurar archivos junto con metadata conforme a EQ-09.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-04, EQ-05, EQ-09 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D09: límites de archivo, retención/borrado, política de garantía y responsables de revisión antes de habilitar cargas/garantías.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

- [002-usuarios-acceso](../002-usuarios-acceso/spec.md).
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
