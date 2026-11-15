# Pruebas de atributos de calidad

Evidencia de las pruebas automatizadas de Qatu y su relación con los atributos de calidad (AC) y escenarios (EQ) definidos en [04 - Atributos de calidad](../01-analisis-de-sistema/04-atributos-de-calidad.md) y [08 - Escenarios](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).

**Fecha:** 2026-11-15. **Rama:** `feat/011-mapas` (sobre `main` en `3d61995`, con los incrementos hasta 011.1).
**Entorno:** Windows 11, Node.js 24, Chrome, PostgreSQL/PostGIS 17.5 en Docker. Build de producción del frontend (`next start`) y backend local, cada corrida con una base `_test` nueva y sin tocar la base de desarrollo.

## Resumen

| Herramienta | Qué se ejecutó | Resultado |
|---|---|---|
| node:test (backend) | Pruebas unitarias y de integración con PostgreSQL real | **195 de 195** aprobadas, 157 s → [backend/node-test.txt](backend/node-test.txt) |
| Playwright | 8 suites de recorridos de navegador (las mismas del CI) | **46 de 46** aprobadas → [playwright/resumen.json](playwright/resumen.json) |
| Lighthouse 12.6.1 | 6 páginas × celular y escritorio (12 reportes) | Accesibilidad 92–100, SEO 100, buenas prácticas 96–100; LCP de escritorio 0,7–1,1 s; **LCP de celular 2,9–3,8 s** → [lighthouse/](lighthouse/) |

## Atributos de calidad y su evaluación

| Atributo | Escenario | Meta | Prueba | Resultado | Estado |
|---|---|---|---|---|---|
| **AC06 Usabilidad** | EQ-06 Uso móvil | Sin scroll horizontal | Playwright: inicio, resultados y detalle a 360, 390 y 1440 px; reservas, Mi lista, pago, WhatsApp y mapas a 360 px | Sin desborde en todas las pantallas probadas | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | LCP ≤ 2,5 s | Lighthouse escritorio (red 40 ms, CPU ×1) | 0,74–1,11 s en las 6 páginas | ✅ Cumple |
| AC06 Usabilidad | EQ-06 | LCP ≤ 2,5 s; contenido principal ≤ 3 s | Lighthouse celular (4G lenta simulada: 150 ms, CPU ×4) | 2,94 s en pago; 3,44–3,81 s en las demás | ❌ No cumple en celular |
| AC06 Usabilidad | EQ-06 | Accesible | Lighthouse accesibilidad + Playwright (teclado, etiquetas, foco) | 92–100; tres hallazgos menores (ver abajo) | ⚠️ Cumple con observaciones |
| AC06 Usabilidad | EQ-06 | 4 de 5 participantes completan en ≤ 3 min | Prueba con usuarios | No ejecutada | ⏳ Pendiente |
| **AC04 Seguridad** | EQ-04 Autorización | 100 % de casos no autorizados rechazados | Backend: privacidad de perfiles, documentos, evidencias, reservas ajenas, Mi lista, WhatsApp y punto exacto; Playwright: perfil privado, sesiones revocadas, rutas de regreso maliciosas (`//`, `/\`, `https://`) | Todos los casos definidos rechazados (401, 403, 404 o 409) | ✅ Cumple para los casos definidos |
| AC04 Seguridad | EQ-04 | 0 vulnerabilidades críticas o altas | OWASP ZAP | No ejecutado | ⏳ Pendiente |
| **AC08 Integridad** | EQ-07 Conflicto de fechas | 0 rangos superpuestos | Backend: *EQ-07 local: 100 pares concurrentes, una aceptación por par y cero rangos superpuestos* | 0 superposiciones | ✅ Cumple |
| AC08 Integridad | EQ-08 Pago repetido | 0 duplicaciones | Backend: pagos idempotentes; Mi lista: dos envíos simultáneos crean una sola solicitud; Playwright pagos | 0 duplicaciones | ✅ Cumple |
| **AC07 Resiliencia** | EQ-08 Pago incierto | Fallos externos controlados | Backend y Playwright: resultado desconocido o timeout de la pasarela no se presenta como rechazo y no ofrece pagar de nuevo | Controlado | ✅ Cumple (pagos); IA (EQ-02, EQ-10) aún no implementada |
| **AC09 Recuperabilidad** | EQ-09 | Restaurar y verificar | Backend: *EQ-09: el verificador acepta una base íntegra y detecta clave distinta, archivo dañado y migración faltante* | Verificado localmente | ⚠️ Parcial: RPO y RTO se miden en 008 |
| **AC05 Mantenibilidad** | EQ-05 | Cobertura ≥ 80 %, duplicación ≤ 3 % | SonarQube | No medido; la suite cubre 7 módulos con 241 pruebas automatizadas y el validador de entrega | ⏳ Pendiente de medición |
| **AC01 Rendimiento** | EQ-01 | p95 ≤ 1 s con carga | k6 | No ejecutado. Referencia de Lighthouse: tiempo de respuesta del servidor de 32–299 ms por página | ⏳ Pendiente |
| **AC02 Disponibilidad / AC03 Escalabilidad** | EQ-02, EQ-03 | 99,9 %; 500 usuarios | Uptime Kuma, k6 | Requieren el despliegue (008) | ⏳ Pendiente |

## Lighthouse por página

| Página | Dispositivo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Inicio | Celular | 71 | 92 | 96 | 100 | 3,45 s | 851 ms | 0,058 |
| Inicio | Escritorio | 80 | 92 | 96 | 100 | 0,74 s | 451 ms | 0,039 |
| Búsqueda | Celular | 63 | 98 | 96 | 100 | 3,81 s | 1520 ms | 0 |
| Búsqueda | Escritorio | 86 | 98 | 96 | 100 | 0,79 s | 314 ms | 0,016 |
| Detalle con mapa | Celular | 61 | 100 | 96 | 100 | 3,46 s | 2787 ms | 0 |
| Detalle con mapa | Escritorio | 75 | 100 | 96 | 100 | 0,77 s | 555 ms | 0 |
| Ingresar | Celular | 69 | 100 | 100 | 100 | 3,44 s | 1023 ms | 0 |
| Ingresar | Escritorio | 98 | 100 | 100 | 100 | 0,80 s | 122 ms | 0 |
| Mi lista | Celular | 64 | 100 | 100 | 100 | 3,80 s | 689 ms | 0,168 |
| Mi lista | Escritorio | 95 | 100 | 100 | 100 | 1,11 s | 134 ms | 0,051 |
| Pago | Celular | 64 | 100 | 100 | 100 | 2,94 s | 823 ms | 0,217 |
| Pago | Escritorio | 94 | 100 | 100 | 100 | 1,08 s | 48 ms | 0,12 |

Cada fila tiene su reporte HTML en [lighthouse/](lighthouse/) (por ejemplo, `detalle-con-mapa-movil.report.html`), que se abre en el navegador. Mi lista y pago se midieron con una sesión de cliente; el pago, sobre una reserva aceptada.

## Playwright por suite

| Suite | Atributos | Aprobadas | Duración |
|---|---|---|---|
| descubrimiento | AC06 (sin desborde a 360/390/1440 px, teclado, imagen descrita) | 14/14 | 98 s |
| acceso | AC06 (errores accesibles), AC04 | 3/3 | 31 s |
| usuarios | AC04 (perfil privado, sesiones revocadas, administración auditada) | 4/4 | 163 s |
| proveedores | AC04 (documentos privados, revisión por administrador) | 6/6 | 79 s |
| catálogo | AC04 (propiedad, WhatsApp requerido para publicar), AC08 (edición con versión: 409) | 2/2 | 49 s |
| reservas | AC08 (efectivo, agenda), AC04 (Mi lista, regreso seguro, WhatsApp y punto exacto tras la aceptación), AC06 (360 px) | 12/12 | 185 s |
| pagos | AC07 y AC08 (rechazo sin cobro, resultado desconocido sin repetir pago) | 2/2 | 50 s |
| reseñas | AC04 (evidencias privadas, incidencias), AC06 | 3/3 | 58 s |

El detalle de cada prueba está en `playwright/<suite>.json` y `playwright/<suite>.txt`.

## Hallazgos

1. **Carga en celular sobre 4G lenta (AC06, no cumple).** El LCP queda entre 2,9 y 3,8 s. Lighthouse atribuye la mayor parte al trabajo de JavaScript en el hilo principal (4,9 s en inicio y 7,1 s en el detalle con CPU ×4) y al JavaScript que no se usa (unos 300–400 ms). El elemento LCP es la imagen del hero en inicio y la ilustración de la oferta en el detalle. Mejoras propuestas: dividir el JavaScript por ruta, cargar el mapa solo al acercarse a él, conectar antes con los mosaicos (`preconnect`) y servir la imagen del hero en tamaños adecuados.
2. **Desplazamiento visual en Mi lista y pago en celular (CLS 0,17 y 0,22, recomendado ≤ 0,1).** El contenido llega después de consultar la API y empuja lo que ya estaba. Reservar el alto del contenido mientras carga lo corrige.
3. **Accesibilidad en inicio (92).** Las estrellas de los testimonios usan `aria-label` en un `div` sin rol (corrección: `role="img"`), y los números decorativos «01 / 02 / 03» de «Cómo funciona» tienen bajo contraste aunque están ocultos para lectores de pantalla.
4. **Orden de títulos en búsqueda (98).** Las tarjetas usan `h3` sin un `h2` previo; falta un título de sección para los resultados.
5. **Problemas detectados y corregidos durante estas pruebas:** `GET /publicaciones/:id/ubicacion` devolvía un cuerpo vacío cuando no había ubicación (ahora `{ ubicacion: null }`); la prueba de catálogo reenviaba la oferta con el campo nuevo `ubicacion`; los botones de zoom del mapa mostraban «±» y el mapa de resultados cargaba incompleto.

## Cómo repetir las pruebas

Con la base de Docker activa y los puertos 3100, 3300 y 3401 libres (no interfiere con el backend de desarrollo en 3001):

```bash
# Backend en su propia base _test (como en CI): definir DATABASE_URL y TEST_DATABASE_URL, luego
cd backend && npm run migrate && npm test > ../docs/06-pruebas-atributos-calidad/backend/node-test.txt; cd ..
# Las 8 suites de Playwright en otra base _test; guarda los resultados en esta carpeta.
bash docs/06-pruebas-atributos-calidad/scripts/correr-pruebas.sh "$(pwd)"
# Lighthouse (instalarlo una vez en una carpeta aparte).
npm install --prefix /ruta/temporal/lh lighthouse@12.6.1
node docs/06-pruebas-atributos-calidad/scripts/lighthouse.mjs "$(pwd)" /ruta/temporal/lh/node_modules/lighthouse/cli/index.js
# Quitar rutas locales de los registros antes de guardarlos.
node docs/06-pruebas-atributos-calidad/scripts/sanear-rutas.cjs "$(pwd)"
```

Las suites de usuarios y reservas aceptan `QATU_E2E_API_PORT` para usar otro puerto de backend (en CI sigue siendo 3001). El frontend debe compilarse y arrancarse con `QATU_API_URL` apuntando a ese backend, porque las páginas consultan la API desde el servidor.

## Limitaciones

- Mediciones en una sola computadora de desarrollo; Lighthouse simula la red y la CPU, así que las cifras varían entre corridas y equipos.
- No hay HTTPS en local; «buenas prácticas» no evalúa la seguridad del transporte.
- Los atributos de disponibilidad, escalabilidad y rendimiento con carga necesitan el entorno desplegado (spec 008).
