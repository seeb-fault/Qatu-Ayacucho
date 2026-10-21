# 003 — Proveedores y verificación

**Estado:** perfiles, revisión documental y consulta pública implementados localmente; verificación en quickstart. D02, mapas externos e integración de Catálogo pendientes. **Actualizado:** 2026-10-19.
**Módulo técnico:** proveedores. **Historias:** HU12.

## Objetivo y alcance

Gestionar el perfil del proveedor, su cobertura por zona y la revisión documental que habilita su oferta.

Interfaz prevista: Alta/edición de proveedor, estado de revisión, resumen público y cola de verificación administrativa.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Crear perfil (P1)

Como usuario, quiero registrarme como proveedor.

**Prueba independiente:** Dado una cuenta activa, cuando completo perfil y distrito, entonces se registra un perfil propio sin duplicarlo.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Verificar proveedor (P1)

Como administrador, quiero revisar documentación.

**Prueba independiente:** Dado documentos privados remitidos, cuando apruebo o rechazo con motivo, entonces el resultado queda auditado y solo una aprobación válida habilita publicación.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Consultar oferta local (P1)

Como visitante, quiero conocer cobertura y verificación.

**Prueba independiente:** Dado un perfil visible, cuando consulto sus datos, entonces veo información pública y estado real, nunca documentos privados.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M003-FR01 | Un perfil de proveedor por usuario; identidad consultada por fachada de Usuarios. | RF13 |
| M003-FR02 | Solo administrador autorizado resuelve verificación; el proveedor no se autoaprueba. | RF13 |
| M003-FR03 | Documentos de verificación no aparecen en perfil público; descargas requieren permiso. | RF13 |
| M003-FR04 | Mapas por adapter y distrito manual como respaldo. La caída del mapa no impide completar la zona manual. | RF13 |
| M003-FR05 | Catálogo consulta estado activo/verificado antes de publicar; desactivación debe impedir nuevas operaciones según política D02. | RF13 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: proveedores; verificaciones. Identidad de actor derivada del servidor. Contratos entre módulos: ConsultaProveedores: perfil público, zona y estado; documentos y observaciones internas permanecen privados.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- Perfil duplicado y usuario inexistente/inactivo.
- Acceso a documento propio, ajeno y administrativo; URL no pública.
- Fallo de mapas conserva selección manual; estado de verificación no modificable por cliente.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-04, EQ-05, EQ-06 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D02: tratamiento de publicaciones y reservas existentes al desactivar un proveedor; pendiente antes de desactivación operativa.
- D03 documental resuelta por el usuario: documentos reales, conservar mientras esté activo. PDF/JPEG/PNG privados cifrados, 1–2 archivos de 5 MiB y consentimiento; detalle en research.md. Mapas externos siguen pendientes, con distrito manual disponible.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

- [002-usuarios-acceso](../002-usuarios-acceso/spec.md).

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
