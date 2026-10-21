# Tareas — Descubrimiento

Prototipo local implementado y comprobado. Tareas de integración con backend real pendientes; las casillas completas corresponden únicamente al alcance descrito.

## Fase 1 — Preparación

- [x] T001 Fijar versiones soportadas y estructura Next.js en frontend/package.json; no agregar backend diferente al diseñado.
- [x] T002 Definir fixtures identificados de herramienta/oficio y contrato de filtros en frontend/src/lib/catalogo.ts y specs/001-descubrimiento-ofertas/contracts/api.md.

## Fase 2 — Componentes base

- [x] T003 Implementar navegación, estilos y adapter local de datos en frontend/src/app/layout.tsx, frontend/src/app/globals.css y frontend/src/lib/api/. No representa conexión REST real.

## Fase 3 — US1 Encontrar ofertas

- [x] T004 [US1] Implementar buscador y filtros editables persistidos en URL en frontend/src/components/descubrimiento/Buscador.tsx y frontend/src/app/buscar/page.tsx.
- [x] T005 [US1] Verificar filtros compatibles y retorno sin perder consulta en frontend/tests/descubrimiento/busqueda.spec.ts.

## Fase 4 — US2 Comparar resultados

- [x] T006 [US2] Implementar tarjetas/paginación/estado vacío en frontend/src/components/descubrimiento/TarjetaOferta.tsx y frontend/src/app/buscar/page.tsx con tarifa y modalidad correctas.
- [ ] T007 [US2] Conectar catálogo real de 004 en frontend/src/lib/api/publicaciones.ts; no marcar integrado con fixtures.

## Fase 5 — US3 Detalle

- [x] T008 [US3] Implementar galería, condiciones y variantes herramienta/oficio en frontend/src/app/publicaciones/[id]/page.tsx.
- [ ] T009 [US3] Componer resúmenes públicos de proveedor/reputación en frontend/src/lib/api/; mostrar ausencia hasta que 003/006 estén disponibles.

## Fase 6 — US4 Recuperación y móvil

- [x] T010 [US4] Implementar carga/error/reintento/no encontrado en frontend/src/components/descubrimiento/Estados.tsx.
- [x] T011 [US4] Comprobar teclado, 360/390 px y escritorio sin scroll horizontal en frontend/tests/descubrimiento/accesibilidad.spec.ts.

## Cierre

- [ ] T012 Ejecutar recorrido con datos persistidos y registrar evidencia en specs/001-descubrimiento-ofertas/quickstart.md.

Dependencias: T001–T003 antes de historias; API real depende de 003/004/006. UI y fixtures pueden trabajarse en archivos independientes después de contrato; no asignar [P] a cambios del mismo archivo. Sin integración de solicitud de 005 no declarar cumplido todo EQ-06.
