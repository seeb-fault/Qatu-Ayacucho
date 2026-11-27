# Investigación — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

## Punto de partida (2026-11-25)

Las 230 pruebas del backend usaban `node:test`. El Sprint 2 pide Jest y un reporte de cobertura. La carga del Sprint 1 llegó a 500 usuarios en una laptop y se saturó (p95 3,8 s).

## Decisiones (2026-11-25, Santiago Noe)

- **Migrar a Jest sin reescribir las pruebas.** Las suites de integración preparan una vez la base, la API y las cuentas y recorren casos en orden sobre ese estado. Reestructurarlas en `describe`/`beforeAll` cambiaría cientos de líneas con riesgo de alterar lo que prueban. Se convirtieron con un script verificable: los casos se ejecutan con `caso()` dentro de cada prueba de Jest. Jest cuenta 91 pruebas que recorren 149 casos con nombre, más las unitarias.
- **SWC en vez de ts-jest.** Compila más rápido y con menos memoria; soporta los decoradores de Nest.
- **Adaptador de `assert`.** Jest aísla cada archivo en un contexto vm; `deepStrictEqual` entre un objeto de `fetch().json()` y un literal de la prueba fallaba sin diferencias visibles. El adaptador solo copia objetos y arreglos planos al contexto de la prueba; el resto de la comparación sigue estricta.
- **Carga en GitHub Actions.** 2 000 usuarios no caben en la laptop (11 GB, con otros proyectos en Docker) y la cuenta de AWS sigue en verificación. Un runner `ubuntu-24.04` (4 núcleos, 16 GB) es reproducible y gratuito, porque el repositorio es público. PostgreSQL, API y k6 comparten la máquina: el resultado es una cota inferior de lo que da un servidor dedicado.
