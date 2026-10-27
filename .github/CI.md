# CI y reconstrucción ordenada

Este repositorio reagrupa trabajo existente y continúa su implementación por especificaciones; no simula fechas pasadas. El repositorio original y sus ramas permanecen intactos. Las nuevas identidades de commit son distintas porque se separan documentación, especificaciones, backend, frontend y pruebas.

## Orden de integración

1. Base mínima en `main`: README y exclusiones de secretos.
2. `chore/ci-github-actions`: infraestructura CI y controles de alcance.
3. `docs/arquitectura`: documentación y activos, herramientas Spec Kit y especificaciones futuras 004–008, todavía sin implementación.
4. `001-descubrimiento-ofertas`: especificación y prototipo web con datos sintéticos; sin cuentas ni backend.
5. `002-usuarios-acceso`: especificación, backend, migraciones, cuentas, administración y nuevo diseño de acceso.
6. `003-proveedores-verificacion`: especificación, perfiles, documentos cifrados y revisión privada.
7. `feat/004-catalogo-publicaciones`: publicación, catálogo persistido y moderación implementados funcionalmente; ensayos globales de carga pendientes.

Las ramas se preparan de forma apilada para conservar dependencias. Publicarlas e integrarlas en ese orden, con un PR hacia `main` cada vez. Antes de fusionar una entrega, su predecesora ya debe estar integrada. Usar **Create a merge commit**, no squash ni force push. No fusionar mientras haya checks aplicables fallidos o pendientes.

## Alcance explícito del CI

`.github/entrega.json` declara la última entrega implementada. Un detector validado con pruebas exige sus especificaciones y aplicaciones; quitar un módulo exigido hace fallar el CI. No se omiten pruebas solo porque falte una carpeta.

El campo opcional `incrementos` declara avances parciales: `005.1` exige los artefactos y pruebas de solicitudes y activa `test:reservas` después de Catálogo, conservando `ultimaEntrega=004`. No declara terminado el módulo 005. El backend incluye sus pruebas en `npm test`; las E2E usan las bases efímeras y se ejecutan secuencialmente con las demás suites.

| Entrega declarada | Especificaciones y evidencias | Backend | Frontend |
| --- | --- | --- | --- |
| base | Detector, seguridad y Spec Kit cuando exista | No aplica, job omitido | No aplica, job omitido |
| 001 | Detector, seguridad y especificaciones presentes | No aplica, job omitido | Compilación, tipos y descubrimiento |
| 002 | Mismos controles | Usuarios con PostgreSQL real | Descubrimiento, acceso, usuarios y administración |
| 003 | Mismos controles | Usuarios y proveedores con PostgreSQL real | Descubrimiento, acceso, usuarios y verificación documental |
| 004 | Mismos controles, detector ampliado | Usuarios, proveedores y catálogo con PostgreSQL real | Todas las anteriores y publicación/búsqueda/edición/moderación reales |

Los jobs omitidos no son pruebas ejecutadas ni aprobadas. El manifiesto no elimina pendientes de aceptación: 004 cierra T023 con la medición local y conserva T027 para los ensayos globales EQ-01/EQ-03; D02 y mapas externos siguen abiertos. El detector, sus pruebas y el workflow incluyen 004. Las E2E con API arrancan el backend compilado; el job frontend instala y compila backend antes de los recorridos.

El CI corre en pushes a todas las ramas, PR hacia `main` y ejecución manual. Usa Node.js 24 y Ubuntu 24.04; PostGIS 17/3.5 con bases efímeras solo cuando corresponde. Las claves documentales/JWT de pruebas se generan por ejecución; nunca se usa `.env` de desarrollo ni producción. Las evidencias sintéticas duran siete días. El detector Mapbox no sustituye un escáner general de secretos.

## Protección remota

El propietario debe activar en GitHub una regla de protección/ruleset de `main` que exija PR, rama actualizada y los checks **Especificaciones y evidencias**, **Backend e integración PostgreSQL** y **Frontend y recorridos de navegador**. Seleccionar GitHub Actions como origen y no permitir bypass, force push ni eliminación de `main`. Los jobs omitidos de etapas sin aplicación deben ser visibles y revisados según la tabla.

Habilitar **Allow merge commits** en Settings → General. No exigir aprobación de un tercero si no hay otro colaborador que pueda revisar; el autor no aprueba su propio PR. El workflow no configura reglas remotas, no despliega y no fusiona automáticamente.

Si GitHub bloquea Actions por facturación o permisos, no presentar la ejecución como aprobada. Las pruebas locales son evidencia adicional, no reemplazan los checks requeridos del PR. Revisar el bloqueo con el propietario y GitHub Support.

Referencias: [sintaxis de Actions y servicios condicionales](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Playwright en CI](https://playwright.dev/docs/ci), [protección de ramas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
