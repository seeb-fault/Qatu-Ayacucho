# Tareas — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

Estado: etapa 1 implementada (2026-11-25).

## Jest

- [x] T001 Jest 30, @jest/globals y @swc/jest; jest.config.cjs con cobertura V8.
- [x] T002 [US1] Convertir las 31 suites de node:test a Jest con test/caso.ts, sin perder casos.
- [x] T003 [US1] test/assert-jest.ts para comparaciones profundas entre contextos vm.
- [x] T004 [US1] npm test y npm run test:cobertura; CI con cobertura y reporte Bruno como artefactos.
- [x] T005 [US1] Contrato OpenAPI estable con cualquier compilador (parámetros de ruta y cabeceras).

## Carga

- [x] T006 [US2] Perfil PERFIL=2000 en carga.k6.js con métricas y metas por escalón.
- [x] T007 [US2] Workflow .github/workflows/carga.yml con caché 0 y 30 s y artefactos.
- [x] T008 [US2] Ejecutar el workflow y registrar resultados en docs/06-pruebas-atributos-calidad/carga-2000/.
