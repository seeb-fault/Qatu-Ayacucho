# Entrega del Sprint 2: implementación y validación de la arquitectura

Este documento relaciona cada actividad y cada entregable del Sprint 2 con su evidencia en el repositorio. Todas las pruebas se pueden repetir con los comandos de cada enlace, y el CI de GitHub Actions las ejecuta en cada cambio.

## Actividades

| # | Actividad | Cómo se cumple | Evidencia |
|---|---|---|---|
| 1 | Implementar el estilo arquitectónico | **Monolito modular**: una API NestJS con 6 módulos de negocio (usuarios, proveedores, catálogo, reservas, pagos, reseñas) y uno compartido. Cada módulo es dueño de sus tablas y expone una fachada; ninguno lee tablas de otro | [Estilo arquitectónico](../02-arquitectura-software/estilo-arquitectonico.md) · [backend/src/modules/](../../backend/src/modules/) · [Modelo C4](../04-modelo-c4/) |
| 2 | Aplicar el enfoque o patrón arquitectónico | **Clean Architecture** dentro de cada módulo: `dominio/` (reglas puras, sin NestJS ni `pg`), `aplicacion/` (casos de uso), `infraestructura/` (PostgreSQL, Culqi, R2, caché) y `presentacion/` (controladores HTTP). Las dependencias apuntan hacia el dominio | [Enfoque arquitectónico](../02-arquitectura-software/enfoque-arquitectonico.md) · [Diseño interno de módulos](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) |
| 3 | Especificaciones SDD con criterios de aceptación y tareas técnicas | 16 specs con Spec Kit (`spec.md` con historias, pruebas independientes y criterios; `plan.md`; `tasks.md`; `research.md`; `data-model.md`; `contracts/`; `quickstart.md` con resultados). El CI valida su estructura y el manifiesto de entrega | [specs/](../../specs/README.md) · [validar-specs.ps1](../../specs/scripts/validar-specs.ps1) · [.github/entrega.json](../../.github/entrega.json) |
| 4 | Endpoints REST funcionales y documentados con OpenAPI/Swagger | 94 operaciones REST en `/api/v1`, documentadas desde el código con `@nestjs/swagger`. Página Swagger UI en `/api/v1/docs` (con «Try it out») y contrato versionado. Una prueba falla si una ruta queda sin documentar o el contrato se desactualiza | [openapi.json](../03-diseño-de-software/diseño-externo/openapi.json) · [Spec 014](../../specs/014-documentacion-api/spec.md) · [openapi.test.ts](../../backend/test/compartido/openapi.test.ts) |
| 5 | Analizar el comportamiento de la base de datos y la estrategia de caché | `EXPLAIN ANALYZE` de las consultas reales con 1 000 publicaciones y 5 000 reservas. Optimización de «Mis reservas» (7,6 → 1,5 ms). Caché en memoria de la búsqueda pública (Decorator, TTL 30 s, LRU, invalidación por escritura) y `Cache-Control` en lecturas públicas. Efecto medido con k6 | [Base de datos y caché](../06-pruebas-atributos-calidad/base-de-datos/README.md) · [Spec 015](../../specs/015-cache-y-base-de-datos/spec.md) |
| 6 | Aplicar principios SOLID y patrones de diseño | Cada principio con su evidencia en el código. Patrones aplicados: Adapter (Culqi, R2), Repository, Facade (fachadas entre módulos), Decorator (caché), Outbox (eventos de reservas) | [Principios de diseño](../03-diseño-de-software/diseño-interno/principios-de-diseño.md#evidencia-en-el-código-sprint-2) · [Patrones de diseño](../03-diseño-de-software/diseño-interno/patrones-de-diseño.md) |
| 7 | Pruebas automatizadas con Jest integradas en CI/CD con GitHub Actions | **Jest 30**: 32 suites (unitarias de dominio e integración con PostgreSQL real) que recorren las reglas de negocio de los 6 módulos. Cobertura del 98,8 % de líneas. El workflow `CI Qatu` las corre en cada push, junto con Bruno y 8 suites de navegador con Playwright | [Spec 016](../../specs/016-pruebas-jest-y-carga/spec.md) · [jest.config.cjs](../../backend/jest.config.cjs) · [ci.yml](../../.github/workflows/ci.yml) |
| 8 | Pruebas de los escenarios de atributos de calidad (Postman/Bruno, k6 hasta 2 000 usuarios, Jest…) | **k6** sube por escalones de 100 a **2 000 usuarios virtuales** en GitHub Actions, sin caché y con caché. **Bruno** (alternativa a Postman) cubre 45 pruebas de contrato y reglas de negocio. Además, del Sprint 1: Playwright, Lighthouse, SonarQube y OWASP ZAP | [Carga hasta 2 000 usuarios](../06-pruebas-atributos-calidad/carga-2000/README.md) · [Bruno](../06-pruebas-atributos-calidad/bruno/README.md) · [Pruebas de atributos de calidad](../06-pruebas-atributos-calidad/README.md) |

## Entregables

| Entregable | Dónde está |
|---|---|
| Código fuente organizado según la arquitectura propuesta | [backend/src/modules/](../../backend/src/modules/) (un módulo por contexto, cuatro capas en cada uno) y [frontend/src/](../../frontend/src/) |
| Primera versión funcional del proyecto | Registro e inicio de sesión, perfiles y verificación de proveedores, catálogo con búsqueda y mapas, reservas de herramientas y oficios, pagos de prueba con Culqi, reseñas, evidencias, incidencias y Libro de Reclamaciones. Imágenes Docker y despliegue con Dokploy en [infra/](../../infra/) |
| Documentación de la API con OpenAPI/Swagger | `/api/v1/docs` en desarrollo y [openapi.json](../03-diseño-de-software/diseño-externo/openapi.json) |
| Pruebas automatizadas con Jest y reporte de cobertura | `npm run test:cobertura` en `backend/` · [Reporte HTML de cobertura](../06-pruebas-atributos-calidad/jest/cobertura/index.html) · [Salida de Jest](../06-pruebas-atributos-calidad/jest/jest.txt) · artefacto `cobertura-backend` de cada corrida del CI |
| Evidencias y resultados de la validación de los atributos de calidad | [docs/06-pruebas-atributos-calidad/](../06-pruebas-atributos-calidad/README.md) |

## Resultados principales

| Prueba | Resultado |
|---|---|
| Jest (backend) | **32 de 32 suites**; 90 pruebas que pasan y 1 omitida (R2 real, requiere credenciales); cobertura de **98,8 %** de líneas, **89,8 %** de ramas y **98,3 %** de funciones |
| Bruno (API) | **45 de 45** pruebas en 36 peticiones |
| Playwright (navegador) | Las 8 suites pasan en el CI |
| k6 hasta 2 000 usuarios | **Las 12 metas se cumplen** en 4 ejecuciones; 0 % de errores en todos los escalones. Con 2 000 usuarios: p95 de 1,6–1,8 s sin caché y de **168 ms** con caché (mismo procesador; 9,5 veces menos) → [carga-2000](../06-pruebas-atributos-calidad/carga-2000/README.md) |
| Base de datos | Todas las consultas principales por debajo de 5 ms con 1 000 publicaciones y 5 000 reservas |

## Cómo demostrarlo en vivo

1. `docker compose up -d` en la raíz (PostgreSQL de desarrollo); `npm run dev` en `backend/` y en `frontend/`.
2. Abrir `http://localhost:3000` (aplicación) y `http://localhost:3000/api/v1/docs` (Swagger). En Swagger: **POST /auth/login → Try it out** y luego **GET /usuarios/me**.
3. En GitHub → **Actions**: la última corrida de **CI Qatu** (Jest con cobertura, Bruno y Playwright, con sus artefactos) y de **Carga k6** (artefactos `carga-2000-cache-0` y `carga-2000-cache-30`).
