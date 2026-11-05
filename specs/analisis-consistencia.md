# Análisis de consistencia SDD

## Incremento 005.1 (2026-10-27)

Contrato acotado sincronizado entre 005/contracts/api.md y contratos externos: solicitud PENDIENTE, bandejas participantes y rechazo versionado con motivo. Reservas consume las fachadas de Usuarios, Proveedores y Catálogo sin importar sus repositorios; su infraestructura consulta solo reservas/reservas_outbox. La titularidad se expone únicamente por fachada interna, sin incorporarla al perfil público ni a las respuestas HTTP de Reservas.

La solicitud/rechazo y el evento mínimo son atómicos; se prueba rollback ante fallo de outbox. PENDIENTE no bloquea disponibilidad. No hay cálculo comercial, aceptación, pago ni entrega de notificaciones simulados. D05–D08/D12 siguen abiertas. El manifiesto mantiene 004 como última entrega y declara 005.1 como incremento probado; no se cierran US1–US4, EQ-07 ni EQ-08 por este avance.

**Fecha:** 2026-10-15. Revisión documental del asistente; no es resultado de aceptación de aplicación ni ejecución del skill /speckit-analyze.

## Cobertura

- Ocho especificaciones con ocho artefactos cada una: 64 documentos de entrega.
- Seis módulos conservados; 001 y 008 son transversales. Pagos dentro de 005; calendario pertenece a Reservas.
- Matriz global distribuye RF01–RF23 y HU01–HU20; EQ-01–EQ-10 tienen responsables.
- Scripts oficiales de prerequisitos: PASS en las ocho carpetas; 196 tareas con formato Tnnn al crear la base documental; su avance se mantiene en tasks.md. Esto comprueba estructura, no semántica ni ejecución de pruebas.

## Hallazgos abiertos

| Hallazgo | Tratamiento |
|---|---|
| D01 sesión, D02 desactivación, D03 archivos/mapas | Bloquear operaciones afectadas hasta decisión |
| D04 contratos de búsqueda por cerrar | Revisar DTO y filtros antes de backend |
| D05–D08 políticas de reserva/pago y capacidades externas | No implementar cobros sin resolver |
| D09 retención/garantía, D10 proveedor/cuota IA, D11 operación VPS | Precisar antes de activar capacidades |
| D12 coherencia hito/evidencia sin dependencia cíclica | Fijar protocolo antes de RF18/RF19 |
| Nuevas rutas y tabla de cotizaciones no detalladas en docs | Se identifican como propuestas; sincronizar antes de implementar |
| Quickstart aún sin comandos de aplicación | Completar al existir package.json y scripts reales |

## Límites de la revisión

La estructura de SDD y la cobertura de identificadores están verificadas. No se considera concluida la fase oficial de planificación de operaciones con aclaraciones abiertas: los planes de esas operaciones son borradores. No se han ejecutado pruebas EQ, llamadas Culqi/IA, publicación VPS ni convergencia del código.

[Decisiones](./decisiones-pendientes.md) · [Trazabilidad](./trazabilidad.md) · [Uso](./uso-spec-kit.md).

## Comprobaciones ejecutadas

- specs/scripts/validar-specs.ps1: ocho especificaciones, ocho artefactos por entrega, prerequisitos oficiales PASS; 196 tareas pendientes con formato válido.
- Revisión de enlaces internos de documentación propia: 455 comprobados, cero rutas rotas. Se excluyen plantillas genéricas y skills oficiales del conteo.
- Matriz de cobertura: ningún RF01–RF23 ausente. La cobertura de identificadores no sustituye aceptación funcional.
- Estado seleccionado de Spec Kit conservado: specs/001-descubrimiento-ofertas; validación sin cambiar esa selección.

## Avance de la entrega 001

Prototipo Next.js implementado y validado: build/TypeScript correctos y 13 pruebas Chrome aprobadas. Nueve tareas de prototipo completadas; T007/T009/T012 permanecen pendientes de integración real. [Evidencia](./001-descubrimiento-ofertas/quickstart.md). Esto no cambia el estado pendiente de los demás módulos ni de las pruebas EQ completas.

## Implementación 004 (2026-10-26)

Catálogo, editor y moderación implementados con datos persistidos y fachadas acíclicas. D04 resuelta y contratos sincronizados; D02 no habilita nuevas operaciones. El catálogo real es predeterminado, con modo demo explícito separado. Evidencias locales de dominio/PostgreSQL/E2E en quickstart 004. T023/T027 permanecen abiertas para el ensayo de carga global y la aceptación completa de calidad; no se presenta como cumplida por pasar pruebas funcionales.

## Cierre funcional local 004 (2026-10-26)

CI del código: 51 pruebas backend, 28 E2E y 8 del detector aprobadas. Ensayo local de 20 minutos: 75357 peticiones medidas, cero errores técnicos/contrato; p95 de 51/122/388 ms a 10/30/60 usuarios. SQL conserva snapshot/orden y calcula recursos después de paginar (800 → 20 evaluaciones). T023 cerrada para este protocolo local; T027 mantiene el ensayo global con Reservas y VPS en seguimiento de 005/008. Revisión humana independiente y EQ-06 con participantes siguen pendientes. Evidencias en cierre.md y evidencias/carga-local.json; no se infiere aceptación global del MVP.
