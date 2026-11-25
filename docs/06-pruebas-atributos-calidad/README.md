# Pruebas de atributos de calidad

Esta carpeta guarda la evidencia de las pruebas automatizadas de Qatu y la relaciona con los atributos de calidad (AC) y escenarios (EQ) de [04 - Atributos de calidad](../01-analisis-de-sistema/04-atributos-de-calidad.md) y [08 - Escenarios](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).

**Fecha:** 2026-11-15. **Rama:** `feat/011-mapas`, sobre `main` en `3d61995`, con los incrementos hasta 011.1 y las correcciones de rendimiento y accesibilidad de esta evaluación.
**Entorno:** Windows 11, Node.js 24, Chrome, PostgreSQL/PostGIS 17.5 en Docker. Se usó la build de producción del frontend (`next start`) y el backend local. Cada corrida usó una base `_test` nueva y no tocó la base de desarrollo.

## Sprint 2 (2026-11-25)

Evidencia agregada en el Sprint 2. El mapa completo de actividades y entregables está en [docs/07-entrega-sprint-2](../07-entrega-sprint-2/README.md).

| Herramienta | Qué se ejecutó | Resultado |
|---|---|---|
| **Jest 30** (backend) | Las 32 suites del backend (unitarias de dominio e integración con PostgreSQL real), con cobertura | **32 de 32**; cobertura de **98,8 %** de líneas y **89,8 %** de ramas → [jest/](jest/) |
| **Bruno 4.3** (API) | 36 peticiones con 45 pruebas de contrato y reglas de negocio | **45 de 45** → [bruno/](bruno/README.md) |
| **k6 2.4** hasta **2 000 usuarios** | Escalones de 100, 250, 500, 1 000, 1 500 y 2 000 usuarios en GitHub Actions, sin caché y con caché | **12 de 12 metas** en 4 ejecuciones; 0 % de errores. Con 2 000 usuarios, p95 de 1,6–1,8 s sin caché y de **168 ms** con caché → [carga-2000/](carga-2000/README.md) |
| **PostgreSQL** (`EXPLAIN ANALYZE`) | Consultas reales con 1 000 publicaciones y 5 000 reservas | Todas por debajo de 5 ms; «Mis reservas» de 7,6 a 1,5 ms → [base-de-datos/](base-de-datos/README.md) |

## Contenido de la carpeta

| Carpeta | Contenido |
|---|---|
| [jest/](jest/) | Sprint 2: salida de Jest y [reporte HTML de cobertura](jest/cobertura/index.html) del backend |
| [bruno/](bruno/README.md) | Sprint 2: colección Bruno de la API y sus reportes (HTML, JSON, JUnit) |
| [carga-2000/](carga-2000/README.md) | Sprint 2: k6 hasta 2 000 usuarios en GitHub Actions, sin caché y con caché |
| [base-de-datos/](base-de-datos/README.md) | Sprint 2: planes de ejecución de PostgreSQL y estrategia de caché |
| [backend/](backend/) | Sprint 1: salida completa de `npm test` del backend (node:test) |
| [playwright/](playwright/) | Resultado de cada suite de navegador (`<suite>.json` y `<suite>.txt`) y [resumen.json](playwright/resumen.json) |
| [lighthouse/01-inicial/](lighthouse/01-inicial/) | Primera medición: 12 reportes HTML y [resumen.json](lighthouse/01-inicial/resumen.json) |
| [lighthouse/02-tras-correcciones/](lighthouse/02-tras-correcciones/) | Medición después de corregir los hallazgos: 12 reportes HTML y [resumen.json](lighthouse/02-tras-correcciones/resumen.json) |
| [carga/](carga/) | Prueba de carga con k6: resumen, métricas por nivel, entorno y uso de CPU y memoria |
| [sonarqube/](sonarqube/) | Análisis estático y cobertura: primera corrida y corrida tras las correcciones |
| [zap/](zap/) | Escaneos de OWASP ZAP (pasivo, activo y activo con sesión): primera corrida y corrida tras las correcciones |
| [scripts/](scripts/) | Scripts para repetir las pruebas (ver «Cómo repetir las pruebas») |

## Resumen

| Herramienta | Qué se ejecutó | Resultado |
|---|---|---|
| node:test (backend) | Pruebas unitarias y de integración con PostgreSQL real | **195 de 195** aprobadas en 170 s → [backend/node-test.txt](backend/node-test.txt) |
| Playwright | Las 8 suites de recorridos de navegador del CI, repetidas después de las correcciones | **46 de 46** aprobadas → [playwright/resumen.json](playwright/resumen.json) |
| k6 2.4 | Carga con 10, 30, 60 y hasta 500 usuarios simultáneos sobre 1 000 publicaciones | p95 de **58 / 78 / 134 ms** con 10, 30 y 60 usuarios; **3,8 s** con 500. 0 % de errores → [carga/](carga/) |
| SonarQube 26.11 | Análisis estático y cobertura del backend | Cobertura **92,7 %**, duplicación **0 %**, puerta de calidad OK. Bugs 37 → 0 y vulnerabilidades 2 → 0 tras corregir → [sonarqube/](sonarqube/) |
| OWASP ZAP 2.17 | 3 escaneos sobre la build de producción: pasivo, activo y activo con sesión | **0 altas y 0 críticas** tras corregir. Las alertas medias que quedan están justificadas → [zap/](zap/) |
| Lighthouse 12.6.1 | 6 páginas en celular y escritorio (12 reportes), antes y después de corregir | Accesibilidad **100** y SEO **100** en todas. Rendimiento en celular: de 61–71 a **85–95**. LCP en escritorio: 0,6–0,9 s. **LCP en celular: 2,5–3,1 s** (antes 2,9–3,8 s) |

## Atributos de calidad y su evaluación

| Atributo | Escenario | Meta | Prueba | Resultado | Estado |
|---|---|---|---|---|---|
| **AC06 Usabilidad** | EQ-06 Uso móvil | Sin scroll horizontal | Playwright: inicio, resultados y detalle a 360, 390 y 1440 px; reservas, Mi lista, pago, WhatsApp y mapas a 360 px | Sin desborde en ninguna de las pantallas probadas | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | LCP ≤ 2,5 s | Lighthouse escritorio (red de 40 ms, CPU ×1) | 0,62–0,90 s en las 6 páginas | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | LCP ≤ 2,5 s; contenido principal ≤ 3 s | Lighthouse celular (4G lenta simulada: 150 ms, CPU ×4) | 2,50 s en ingresar; 2,84–3,13 s en las demás (antes 2,94–3,81 s) | ⚠️ Mejoró, pero no cumple en celular salvo ingresar |
| AC06 Usabilidad | EQ-06 | Estabilidad visual (CLS ≤ 0,1) | Lighthouse | 0–0,058 en todas (antes 0,168 en Mi lista y 0,217 en pago) | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | Accesible | Lighthouse accesibilidad + Playwright (teclado, etiquetas, foco) | 100 en las 12 mediciones (antes 92–100) | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | ≥ 90 % de éxito en tareas; 4 de 5 participantes completan en ≤ 3 min | Prueba con usuarios | No ejecutada | ⏳ Pendiente |
| **AC04 Seguridad** | EQ-04 Autorización | 100 % de casos no autorizados rechazados | Backend: privacidad de perfiles, documentos, evidencias, reservas ajenas, Mi lista, WhatsApp y punto exacto. Playwright: perfil privado, sesiones revocadas y rutas de regreso maliciosas (`//`, `/\`, `https://`) | Todos los casos definidos se rechazan (401, 403, 404 o 409) | ✅ Cumple para los casos definidos |
| AC04 Seguridad | EQ-04 | 0 vulnerabilidades críticas o altas | OWASP ZAP: pasivo, activo y activo con sesión de cliente | 0 altas y 0 críticas. La única alta de la primera corrida era un falso positivo verificado. Se agregaron las cabeceras de seguridad | ✅ Cumple |
| **AC08 Integridad** | EQ-07 Conflicto de fechas | 0 rangos superpuestos | Backend: *EQ-07 local: 100 pares concurrentes, una aceptación por par y cero rangos superpuestos* | 0 superposiciones | ✅ Cumple |
| AC08 Integridad | EQ-08 Pago repetido | 0 duplicaciones | Backend: pagos idempotentes y dos envíos simultáneos de Mi lista que crean una sola solicitud. Playwright: pagos | 0 duplicaciones | ✅ Cumple |
| **AC07 Resiliencia** | EQ-08 Pago incierto | Fallos externos controlados | Backend y Playwright: un resultado desconocido o un timeout de la pasarela no se presenta como rechazo ni ofrece pagar de nuevo | Controlado | ⚠️ Cumple en pagos; falta la IA (EQ-02, EQ-10) y la prueba con Toxiproxy |
| **AC09 Recuperabilidad** | EQ-09 | Restaurar y verificar | Backend: *EQ-09: el verificador acepta una base íntegra y detecta clave distinta, archivo dañado y migración faltante* | Verificado localmente | ⚠️ Parcial: RPO y RTO se miden en 008 |
| **AC05 Mantenibilidad** | EQ-05 | Cobertura ≥ 80 %, duplicación ≤ 3 % | SonarQube + cobertura de node:test | Cobertura del backend 92,7 % (líneas 95 %, ramas 89 %); duplicación 0 %; 0 bugs y 0 vulnerabilidades | ✅ Cumple |
| **AC01 Rendimiento** | EQ-01, EQ-03 | p95 ≤ 1 s y < 1 % de errores | k6 en local | p95 de 58, 78 y 134 ms con 10, 30 y 60 usuarios; 0 % de errores | ✅ Cumple en local; falta medir en el despliegue (008) |
| **AC03 Escalabilidad** | EQ-03 | 500 usuarios con las metas de AC01 | k6 en local | p95 de 3,8 s con 500 usuarios y 0 % de errores. El backend (un proceso) y PostgreSQL se saturan en la laptop | ❌ No cumple en local; medición oficial en el despliegue (008) |
| **AC02 Disponibilidad** | EQ-02 | ≥ 99,9 % mensual | Uptime Kuma | Requiere el despliegue (008) | ⏳ Pendiente |

## Lighthouse por página: antes y después de las correcciones

| Página | Dispositivo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Inicio | Celular | 71 → **87** | 92 → **100** | 96 → 96 | 100 → 100 | 3,45 s → **3,12 s** | 851 → 320 ms | 0,058 → 0 |
| Inicio | Escritorio | 80 → **96** | 92 → **100** | 96 → 96 | 100 → 100 | 0,74 s → **0,70 s** | 451 → 158 ms | 0,039 → 0,001 |
| Búsqueda | Celular | 63 → **93** | 98 → **100** | 96 → 96 | 100 → 100 | 3,81 s → **2,84 s** | 1520 → 177 ms | 0 → 0 |
| Búsqueda | Escritorio | 86 → **100** | 98 → **100** | 96 → 96 | 100 → 100 | 0,79 s → **0,72 s** | 314 → 20 ms | 0,016 → 0,001 |
| Detalle con mapa | Celular | 61 → **85** | 100 → **100** | 96 → 96 | 100 → 100 | 3,46 s → **2,95 s** | 2787 → 391 ms | 0 → 0,058 |
| Detalle con mapa | Escritorio | 75 → **100** | 100 → **100** | 96 → 96 | 100 → 100 | 0,77 s → **0,69 s** | 555 → 26 ms | 0 → 0,001 |
| Ingresar | Celular | 69 → **95** | 100 → **100** | 100 → 100 | 100 → 100 | 3,44 s → **2,50 s** | 1023 → 169 ms | 0 → 0 |
| Ingresar | Escritorio | 98 → **100** | 100 → **100** | 100 → 100 | 100 → 100 | 0,80 s → **0,62 s** | 122 → 1 ms | 0 → 0 |
| Mi lista | Celular | 64 → **90** | 100 → **100** | 100 → 100 | 100 → 100 | 3,80 s → **3,08 s** | 689 → 235 ms | 0,168 → 0 |
| Mi lista | Escritorio | 95 → **100** | 100 → **100** | 100 → 100 | 100 → 100 | 1,11 s → **0,72 s** | 134 → 0 ms | 0,051 → 0,001 |
| Pago | Celular | 64 → **87** | 100 → **100** | 100 → 100 | 100 → 100 | 2,94 s → **3,13 s** | 823 → 310 ms | 0,217 → 0,001 |
| Pago | Escritorio | 94 → **85** | 100 → **100** | 100 → 100 | 100 → 100 | 1,08 s → **0,90 s** | 48 → 337 ms | 0,12 → 0,001 |

Cada fila tiene su reporte HTML en la carpeta de cada corrida, por ejemplo `lighthouse/02-tras-correcciones/detalle-con-mapa-movil.report.html`; se abre en el navegador. Mi lista y pago se midieron con una sesión de cliente; el pago, sobre una reserva aceptada. El pago en escritorio bajó de 94 a 85 por el tiempo de bloqueo (337 ms). Ese valor varía entre corridas, y su LCP y su CLS sí mejoraron.

## Hallazgos y correcciones

| # | Hallazgo (medición inicial) | Atributo | Corrección | Resultado |
|---|---|---|---|---|
| 1 | El mapa del detalle descargaba y ejecutaba Leaflet (unos 150 KB) al abrir la página, aunque estuviera fuera de la vista | AC06 | `Mapa.tsx` carga Leaflet solo cuando el mapa está a menos de 300 px de la vista (`IntersectionObserver`) | TBT del detalle en celular: 2787 → 391 ms; rendimiento: 61 → 85 |
| 2 | En búsqueda, la imagen LCP (primera tarjeta) tenía `loading="lazy"` | AC06 | Las 2 primeras tarjetas cargan su imagen con prioridad (`prioritaria` en `TarjetaOferta`) | LCP de búsqueda en celular: 3,81 → 2,84 s |
| 3 | El LCP del pago en escritorio era una imagen con `loading="lazy"` | AC06 | La imagen del resumen del pago carga con prioridad | LCP: 1,08 → 0,90 s |
| 4 | CLS de 0,168 en Mi lista y de 0,217 en pago: el contenido llegaba de la API y empujaba el pie de página | AC06 | `#contenido` ocupa al menos el alto de la pantalla (`100svh`), así que el pie ya está fuera de la vista | CLS: 0 y 0,001 |
| 5 | Las estrellas de los testimonios usaban `aria-label` en un `div` sin rol | AC06 | `role="img"` | Accesibilidad de inicio: 92 → 100 |
| 6 | Los números decorativos «01 / 02 / 03» de «Cómo funciona» tenían bajo contraste | AC06 | Se pintan con CSS (`::before` con `data-n`): siguen siendo decorativos y no cuentan como texto | Sin fallas de contraste |
| 7 | En búsqueda, las tarjetas usaban `h3` sin un `h2` previo | AC06 | Título de sección «Ofertas encontradas», solo para lectores de pantalla | Accesibilidad de búsqueda: 98 → 100 |
| 8 | En una corrida, el detalle no tenía meta descripción propia (SEO 91) | SEO | `generateMetadata` arma una descripción con el tipo, el distrito y la descripción de la oferta | SEO: 100 |
| 9 | Se detectaron y corrigieron durante la primera evaluación: `GET /publicaciones/:id/ubicacion` devolvía un cuerpo vacío sin ubicación, la prueba de catálogo reenviaba el campo `ubicacion`, el zoom del mapa mostraba «±» y el mapa de resultados cargaba incompleto | AC06, AC05 | Ya incluidas en 011.1 | — |

### Lo que queda pendiente en carga para celular

En la 4G lenta simulada, el LCP de celular sigue entre 2,5 y 3,1 s. La meta es 2,5 s. Casi todo ese tiempo es **retraso de renderizado**, unos 1,8–2,6 s: con la CPU ×4, el navegador ejecuta el JavaScript de React y de los componentes de cliente antes de pintar. Ya no influyen la red ni las imágenes. Sin limitar la red ni la CPU, el LCP observado en la misma computadora fue de 0,3–1,1 s.

Para cumplir la meta en celular hacen falta cambios de mayor alcance, propuestos para una siguiente iteración:
- Pasar a componentes de servidor las partes de la cabecera que no necesitan interacción.
- Quitar PrimeReact del buscador. Solo usa `Button` e `InputText`.
- Eliminar el CSS heredado del diseño anterior: `globals.css` bloquea el renderizado con unos 21 KB, y Lighthouse estima 11–18 KB sin uso.
- Medir en el entorno desplegado con datos de campo (008).

**Buenas prácticas 96** en las páginas públicas: la consola registra dos respuestas 401 de `/lista/resumen` y `/avisos/resumen` cuando el visitante no ha iniciado sesión. Es el comportamiento esperado: la cookie de sesión tiene `Path=/api/v1`, así que el navegador solo sabe si hay sesión preguntándole a la API. No se cambió.

## Playwright por suite

| Suite | Atributos | Aprobadas | Duración |
|---|---|---|---|
| descubrimiento | AC06 (sin desborde a 360/390/1440 px, teclado, imagen descrita) | 14/14 | 46 s |
| acceso | AC06 (errores accesibles), AC04 | 3/3 | 15 s |
| usuarios | AC04 (perfil privado, sesiones revocadas, administración auditada) | 4/4 | 31 s |
| proveedores | AC04 (documentos privados, revisión por administrador) | 6/6 | 39 s |
| catálogo | AC04 (propiedad, WhatsApp requerido para publicar), AC08 (edición con versión: 409) | 2/2 | 33 s |
| reservas | AC08 (efectivo, agenda), AC04 (Mi lista, regreso seguro, WhatsApp y punto exacto tras la aceptación), AC06 (360 px) | 12/12 | 415 s |
| pagos | AC07 y AC08 (rechazo sin cobro, resultado desconocido sin repetir pago) | 2/2 | 33 s |
| reseñas | AC04 (evidencias privadas, incidencias), AC06 | 3/3 | 40 s |

El detalle de cada prueba está en `playwright/<suite>.json` y `playwright/<suite>.txt`. Estos resultados son de la corrida final, después de las correcciones de SonarQube y ZAP. En esa corrida, la prueba de cotizaciones de reservas falló una vez por tiempo: el cliente actualizó antes de que llegara la versión 2. Al repetir la suite pasaron las 12 pruebas. La suite de reservas tardó más porque corrió junto con otros procesos del equipo.

## Prueba de carga con k6 (AC01 y AC03)

**Qué se probó.** [scripts/carga.mjs](scripts/carga.mjs) crea una base `_test` con datos sintéticos: 100 proveedores aprobados, 1 000 publicaciones en todas las categorías y zonas, 5 clientes y 5 000 reservas pendientes. Luego arranca el backend compilado en el puerto 3402 y corre [scripts/carga.k6.js](scripts/carga.k6.js) con k6 2.4 en Docker. Cada usuario virtual repite un recorrido real:
- 70 %: búsqueda con filtros de tipo, categoría, zona, texto, orden y página.
- 20 %: detalle de una publicación y su ubicación aproximada.
- 10 %: un cliente con sesión consulta la disponibilidad y sus reservas.

Hay cuatro niveles seguidos: 10, 30 y 60 usuarios constantes (EQ-01 y EQ-03 locales), y una rampa hasta 500 usuarios (AC03). Cada 5 s se registró el uso de CPU y memoria del backend y de PostgreSQL en [carga/recursos.csv](carga/recursos.csv).

| Usuarios simultáneos | p50 | p95 | p99 | Errores | Meta | Estado |
|---|---|---|---|---|---|---|
| 10 | 25 ms | **58 ms** | 183 ms | 0 % | p95 ≤ 1 s (EQ-01) | ✅ Cumple |
| 30 | 29 ms | **78 ms** | 172 ms | 0 % | p95 ≤ 1 s | ✅ Cumple |
| 60 | 44 ms | **134 ms** | 267 ms | 0 % | p95 ≤ 2 s (EQ-03 local) | ✅ Cumple |
| 500 | 1 930 ms | **3 788 ms** | 4 075 ms | 0 % | p95 ≤ 1 s (AC03) | ❌ No cumple en local |

En total hubo 34 038 peticiones y el 100 % de las comprobaciones pasó, sin ningún error técnico. El detalle está en [carga/k6.txt](carga/k6.txt), [carga/resumen-k6.json](carga/resumen-k6.json) y [carga/entorno.json](carga/entorno.json). El resumen no guarda las cookies de sesión de los clientes de prueba.

**Por qué no llega a 500 usuarios en local.** Todo corrió en una laptop (Ryzen 5 3500U, 4 núcleos y 8 hilos, 11 GB): k6, Docker, PostgreSQL y el backend. Con 500 usuarios fallaron dos recursos a la vez:
- El backend es un único proceso de Node y llegó a **0,99 núcleos**, que es su límite porque ejecuta en un solo hilo.
- PostgreSQL llegó a **250–290 % de CPU** (cerca de 3 núcleos). Casi todo ese trabajo es la búsqueda.

Las peticiones no fallan, pero hacen cola. Para la medición oficial en el despliegue (008) se proponen estos pasos:
1. Revisar con `EXPLAIN ANALYZE` la consulta de búsqueda y agregar índices: trigramas (`pg_trgm`) para el texto `q` e índices compuestos por tipo, categoría y zona.
2. Correr el backend con varios procesos o réplicas detrás del balanceador.
3. Cachear por unos segundos las búsquedas públicas sin sesión.
4. Medir con k6 y Grafana contra el entorno desplegado, con k6 en otra máquina.

## Mantenibilidad con SonarQube (AC05)

[scripts/sonarqube.sh](scripts/sonarqube.sh) hace tres pasos:
1. Corre las pruebas del backend con cobertura (`node --test --experimental-test-coverage`, reporte lcov) en una base `_test` nueva.
2. Levanta SonarQube Community 26.11 en Docker y analiza `backend/src` y `frontend/src` con `sonar-scanner`.
3. Guarda las métricas, la puerta de calidad y las incidencias, y apaga el contenedor.

| Métrica | Meta | Primera corrida ([01-inicial](sonarqube/01-inicial/)) | Tras corregir ([02-tras-correcciones](sonarqube/02-tras-correcciones/)) | Estado |
|---|---|---|---|---|
| Cobertura del backend (líneas + ramas) | ≥ 80 % | 92,7 % | **92,7 %** (líneas 95,0 %, ramas 89,0 %) | ✅ Cumple |
| Duplicación | ≤ 3 % | 0,0 % | **0,0 %** (0 bloques) | ✅ Cumple |
| Puerta de calidad (Sonar way) | Aprobada | OK | **OK** | ✅ |
| Bugs | — | 37 (confiabilidad E) | **0** (confiabilidad A) | ✅ |
| Vulnerabilidades | — | 2 (seguridad B) | **0** (seguridad A) | ✅ |
| Puntos sensibles de seguridad | — | 0 | 0 | ✅ |
| Code smells | — | 5 | 4 (deuda: 20 min) | Revisados |

Se analizaron 6 831 líneas de código (backend y frontend). La cobertura solo se mide en el backend: el frontend se prueba con recorridos de navegador (Playwright), que no generan cobertura por línea, así que se excluye del cálculo (`sonar.coverage.exclusions=frontend/**`). El proyecto usa `node:test`, no Vitest.

| Regla | Incidencias | Qué era | Corrección |
|---|---|---|---|
| S9011 | 36 | Botones de envío sin `type` explícito | `type="submit"` en los 36 botones (23 componentes) |
| S5332 | 2 | `http://` en una URL base de `rutas.ts` | La base ficticia usa `https://qatu.local`; nunca se conecta a ella |
| S2871 | 1 | `sort()` sin comparador en `lista.ts` | Comparador explícito |
| S8786 (crítica) | 1 | Expresión regular del correo con posible retroceso exponencial (ReDoS) | Expresión lineal, con pruebas nuevas en `acceso.test.ts`: correos inválidos y un correo de 241 caracteres que se rechaza en menos de 50 ms |
| S6853 | 3 | Etiquetas «sin control asociado» | Falso positivo. Cada etiqueta envuelve su control, y su texto está en un `span` o un `strong` hijo. En el buscador el control es un `InputText` de PrimeReact, que la regla no reconoce. En el editor de ubicación son los radios de precisión. Lighthouse da 100 en accesibilidad |
| S6671 | 1 | Rechazo de promesa que no es `Error` en `despacho.ts` | Intencional: se rechaza con un símbolo centinela para distinguir el *timeout* de los errores reales |

El detalle está en `incidencias.json`, `metricas.json` y `pruebas-con-cobertura.txt` de cada corrida. La cobertura lcov también se guardó (`lcov-backend.info`).

## Seguridad con OWASP ZAP (AC04)

[scripts/zap.mjs](scripts/zap.mjs) prepara el entorno:
- Crea una base `_test` con los datos de las pruebas de navegador.
- Compila y arranca el backend en el puerto 3401 y la build de producción del frontend en el 3100.
- Inicia sesión como cliente.

Luego corre OWASP ZAP 2.17 en Docker con tres escaneos: pasivo sin sesión (`zap-baseline`), activo sin sesión y activo con la cookie de sesión del cliente (`zap-full-scan`, 8 minutos cada uno). El reporte guarda el token como `<token-de-prueba>`.

| Riesgo | Primera corrida ([01-inicial](zap/01-inicial/)) | Tras corregir ([02-tras-correcciones](zap/02-tras-correcciones/)) |
|---|---|---|
| Crítico / Alto | 1: «Source Code Disclosure – File Inclusion» en `/_next/image` | **0** |
| Medio | Falta CSP; falta protección anti-clickjacking | CSP con `unsafe-inline`; sin token anti-CSRF en `/ingresar`; sitio solo HTTP |
| Bajo | Faltan `X-Content-Type-Options`, `Permissions-Policy`, COEP, COOP y CORP; el backend anuncia `X-Powered-By: Express` | COEP ausente; COOP no es `same-origin` |
| Informativo | Contraseña y correo en la URL de `/ingresar`, entre otros | Solo avisos informativos (contenido cacheable, solicitud de autenticación detectada, etc.) |

**La alerta alta era un falso positivo.** ZAP cambió el parámetro `url` por `/image` y vio que la respuesta difería de la de un valor aleatorio. Al revisarlo a mano, Next responde `404 "url" parameter is valid but internal response is invalid` para `/image` y `400 "url" parameter is invalid` para el valor aleatorio. Las dos son mensajes de error de Next, sin código fuente. En la corrida tras las correcciones ya no apareció.

| Hallazgo | Corrección |
|---|---|
| Sin CSP ni protección anti-clickjacking (medio) | [next.config.ts](../../frontend/next.config.ts) envía `Content-Security-Policy` en todas las páginas. Solo permite el propio sitio, Culqi (`*.culqi.com`) y los mosaicos de OpenStreetMap, y además incluye `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'` y `object-src 'none'`. También envía `X-Frame-Options: DENY` |
| Faltaban `X-Content-Type-Options`, `Permissions-Policy`, `Referrer-Policy`, COOP y CORP (bajo) | Agregadas. `Permissions-Policy` bloquea cámara y micrófono y solo permite la ubicación (la usa el mapa) y el pago con Culqi |
| El backend anunciaba `X-Powered-By: Express` (bajo) | `app.disable('x-powered-by')` en [app.ts](../../backend/src/app.ts) |
| Si se enviaba el formulario de ingreso antes de cargar el JavaScript, el navegador ponía el correo y la contraseña en la URL (`/ingresar?email=…&password=…`) | El formulario usa `method="post"`. Ya no apareció en la segunda corrida |

**Alertas que quedan y por qué se aceptan:**
- **CSP con `unsafe-inline` (medio).** Next.js inyecta scripts en línea para hidratar las páginas. Quitar `unsafe-inline` exige un *nonce* por petición, y eso vuelve dinámicas todas las páginas: se pierde el renderizado estático y empeora el rendimiento. El riesgo se reduce porque React escapa todo el contenido y el resto de la CSP limita los orígenes. Queda como mejora para el despliegue.
- **Sin token anti-CSRF en `/ingresar` (medio, confianza baja).** El formulario no envía nada al servidor de Next: el JavaScript llama a la API. La API ya se protege del CSRF de tres formas:
  - La cookie de sesión es `SameSite=Strict`.
  - Toda petición que no sea GET debe traer el `Origin` exacto de Qatu.
  - Solo se acepta `Content-Type: application/json`, que un formulario de otro sitio no puede enviar.

  Las pruebas del backend verifican que un origen ajeno recibe 403.
- **Sitio solo HTTP (medio).** Es la build local. En el despliegue (008) se exige HTTPS: el backend ya rechaza un `APP_ORIGIN` sin HTTPS en producción.
- **COEP ausente y COOP `same-origin-allow-popups` (bajo).** `Cross-Origin-Embedder-Policy: require-corp` bloquearía los mosaicos de OpenStreetMap y el checkout de Culqi. Por su parte, el checkout de Culqi necesita abrir ventanas propias.
- **«Atributo HTML controlable por el usuario» (informativo).** El valor de la categoría en un `<option>` y la ruta de regreso en un enlace. React los escapa, y la ruta de regreso solo acepta rutas internas de Qatu. Las pruebas de Playwright ya cubren `//`, `/\` y `https://`.

Con esto **AC04 cumple: 0 vulnerabilidades críticas o altas**. Cada carpeta tiene los reportes en HTML (para abrir en el navegador), JSON, Markdown y la salida de consola.

## Atributos que faltan medir

| ID | Atributo | Métrica | Meta | Herramienta | Qué falta | Cuándo |
|---|---|---|---|---|---|---|
| AC01 | Rendimiento | Tiempo de respuesta p95 y errores técnicos | ≤ 1 s y < 1 % de errores | k6 | Ya se midió en local (ver arriba). Falta repetirlo en el entorno desplegado | Requiere el despliegue (008) |
| AC02 | Disponibilidad | Disponibilidad mensual | ≥ 99,9 % | Uptime Kuma | Crear un endpoint de salud en la API y monitorearlo, junto con la portada, durante un mes | Requiere el despliegue (008) |
| AC03 | Escalabilidad | Usuarios virtuales concurrentes | 500 usuarios cumpliendo las metas de AC01 | k6 + Grafana | En local no cumple (p95 de 3,8 s). Optimizar la búsqueda (índices, caché, varios procesos) y medir en el despliegue con panel de Grafana | Requiere el despliegue (008) |
| AC06 | Usabilidad | Éxito en tareas y LCP | ≥ 90 % y LCP ≤ 2,5 s | Lighthouse + pruebas con usuarios | Prueba con 5 participantes (buscar, solicitar, pagar). Bajar el LCP en celular (ver arriba) | Prueba con usuarios: cuando el docente lo indique |
| AC07 | Resiliencia | Fallos externos controlados | 100 % de escenarios críticos | Toxiproxy + Postman | Cortar o retrasar la base y la pasarela con Toxiproxy; colección de Postman con los escenarios. La IA (EQ-02, EQ-10) depende de 007 | Después de 007 |
| AC09 | Recuperabilidad | RPO y RTO | RPO ≤ 24 h y RTO ≤ 4 h | PostgreSQL + pruebas de restauración | Copias programadas y un simulacro de restauración cronometrado. El verificador de integridad ya existe | Requiere el despliegue (008) |

Ya cumplen su meta completa AC05 (Mantenibilidad), AC08 (Integridad) y AC04 (Seguridad), esta última con las alertas medias justificadas en su sección.

## Cómo repetir las pruebas

Con la base de Docker activa y los puertos 3100, 3300, 3401, 3402 y 9000 libres (no interfiere con el backend de desarrollo en 3001):

```bash
# Backend en su propia base _test (como en CI): definir DATABASE_URL y TEST_DATABASE_URL, luego
cd backend && npm run migrate && npm test > ../docs/06-pruebas-atributos-calidad/backend/node-test.txt; cd ..
# Las 8 suites de Playwright en otra base _test; guarda los resultados en esta carpeta.
bash docs/06-pruebas-atributos-calidad/scripts/correr-pruebas.sh "$(pwd)"
# Carga con k6 (Docker): crea su base _test con datos sintéticos y el backend en 3402. --rapido para una corrida corta.
node docs/06-pruebas-atributos-calidad/scripts/carga.mjs "$(pwd)"
# Cobertura + SonarQube (Docker, puerto 9000). El último argumento es la subcarpeta de la corrida.
bash docs/06-pruebas-atributos-calidad/scripts/sonarqube.sh "$(pwd)" 03-nueva-corrida
# OWASP ZAP (Docker): minutos por escaneo activo y subcarpeta de la corrida. Usa la build del frontend ya compilada.
node docs/06-pruebas-atributos-calidad/scripts/zap.mjs "$(pwd)" 8 03-nueva-corrida
# Lighthouse (instalarlo una vez en una carpeta aparte). El último argumento es la subcarpeta de la corrida.
npm install --prefix /ruta/temporal/lh lighthouse@12.6.1
node docs/06-pruebas-atributos-calidad/scripts/lighthouse.mjs "$(pwd)" /ruta/temporal/lh/node_modules/lighthouse/cli/index.js 03-nueva-corrida
# Quitar rutas locales de los registros antes de guardarlos.
node docs/06-pruebas-atributos-calidad/scripts/sanear-rutas.cjs "$(pwd)"
```

Las suites de usuarios y reservas aceptan `QATU_E2E_API_PORT` para usar otro puerto de backend; en CI sigue siendo 3001. El frontend debe compilarse y arrancarse con `QATU_API_URL` apuntando a ese backend, porque las páginas consultan la API desde el servidor.

## Limitaciones

- Las mediciones se hicieron en una sola computadora de desarrollo. Lighthouse simula la red y la CPU, así que las cifras varían entre corridas y equipos. Parte de la mejora del tiempo de bloqueo (TBT) entre ambas corridas puede deberse a una distinta carga del equipo. Las mejoras de LCP en búsqueda, de CLS y de accesibilidad se explican por los cambios.
- No hay HTTPS en local, así que «buenas prácticas» no evalúa la seguridad del transporte.
- La carga con k6 corrió en la misma laptop que el backend, PostgreSQL y Docker: compiten por la CPU. Disponibilidad y la medición oficial de rendimiento y escalabilidad necesitan el entorno desplegado (spec 008).
- ZAP probó la build local por HTTP. En el despliegue hay que repetirlo con HTTPS y HSTS.
