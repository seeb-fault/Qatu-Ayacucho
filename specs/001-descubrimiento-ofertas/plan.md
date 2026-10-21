# Plan — Descubrimiento de ofertas

## Estado y Technical Context

Entrega transversal de interfaz; no es séptimo módulo. Prototipo local implementado; aceptación integrada pendiente. Next.js/React/TypeScript consume REST de Catálogo y perfiles/reputación públicos. El primer prototipo puede usar fixtures rotulados; el cierre funcional requiere backend persistido.

## Constitution Check

El frontend no calcula pagos ni afirma disponibilidad sin fechas verificadas; no muestra insignias inventadas. La composición visual puede consultar rutas públicas separadas: no obliga a Catálogo a importar Reputación ni crea ciclos. Las reglas autoritativas permanecen en módulos de backend.

## Estructura prevista

frontend/src/app/page.tsx; frontend/src/app/buscar/page.tsx; frontend/src/app/publicaciones/[id]/page.tsx. Componentes en frontend/src/components/descubrimiento/ y cliente REST en frontend/src/lib/api/. Estructura inicial implementada en frontend; ver quickstart para resultados. El adapter actual es local con fixtures, no integración REST real.

## Decisiones técnicas propuestas

Conservar texto y filtros en URL para volver a resultados. Filtros tipo/categoría/distrito/precio; limpiar categoría incompatible de forma visible. Resultados con orden estable y paginación de 20. No comparar presupuesto con precio variable sin tarifa numérica comparable. Búsqueda textual convencional sin afirmar interpretación IA. Revisar contrato de filtros en entrega 004 antes del backend.

## Secuencia y aceptación

Prototipo inicio/resultados/detalle → datos persistidos de 004 y perfil de 003 → resumen público de 006 cuando exista. Durante prototipo se muestra falta de reseñas/datos ficticios; la aceptación final espera los módulos. Probar teclado, ancho 360 y 390 px y escritorio, estados vacío/error/carga y retorno conservando filtros. Usabilidad EQ-06 exige además el recorrido de solicitud de 005 y cinco participantes; esta entrega solo valida su segmento.

[Spec](./spec.md) · [Tareas](./tasks.md) · [API](./contracts/api.md).
