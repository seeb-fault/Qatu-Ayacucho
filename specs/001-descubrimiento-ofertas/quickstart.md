# Validación — Descubrimiento de ofertas

## Estado del 15/10/2026

Prototipo local implementado. Build de producción y revisión TypeScript correctos. **13 pruebas Playwright/Chrome aprobadas** después de corregir desborde móvil, identificación de alerta y respuesta 404. No hay backend NestJS, PostgreSQL ni llamadas reales de IA/pago/reserva en esta entrega.

## Entorno y ejecución

Windows; Node.js 24.21.0, Next.js 16.4.1, React 19.3.1, TypeScript 5.9.3 y Playwright 1.64.1. Versiones exactas y lockfile en frontend. Trabajo sin nuevo commit creado por el asistente. Chrome local: C:/Program Files/Google/Chrome/Application/chrome.exe.

Desde frontend, los scripts equivalentes son:

```powershell
npm ci
npm run build
npm test
```

Se ejecutaron directamente con Node las CLI node_modules/next/dist/bin/next build y node_modules/@playwright/test/cli.js test, equivalentes a esos scripts. El build comprueba TypeScript. npm ci se ofrece para reproducir la instalación a partir del lockfile; en esta sesión se instaló con npm install.

Playwright inicia su servidor aislado de producción en 127.0.0.1:3001 y lo cierra al terminar. QATU_TEST_PORT permite otro puerto; QATU_BROWSER permite otro Chrome compatible. La vista previa manual se inicia con npm run dev en 127.0.0.1:3000.

## Resultado de escenarios

| Escenario | Resultado |
|---|---|
| Inicio/resultados/detalle herramienta y oficio a 360 px | Aprobado, sin desborde horizontal |
| Mismas cuatro rutas a 390 px | Aprobado, sin desborde horizontal |
| Mismas cuatro rutas a 1440 px | Aprobado, sin desborde horizontal |
| Salto de contenido y búsqueda por teclado | Aprobado |
| Galería cambia vista y aria-pressed | Aprobado |
| Inicio → filtros → detalle → volver conserva búsqueda | Aprobado |
| Tipo incompatible limpia categoría con aviso | Aprobado |
| Presupuesto excluye precio mayor y servicio sin tarifa comparable | Aprobado |
| Catálogo de 24 ejemplos, páginas de 20 y 4 | Aprobado |
| Vacío permite quitar filtros | Aprobado |
| Error/reintento conserva texto y distrito | Aprobado |
| Oficio a cotizar, imagen ausente, sin reseñas y desactivada 404 | Aprobado |
| Acciones futuras explican alcance sin realizar operaciones | Aprobado |

Pruebas: frontend/tests/descubrimiento/busqueda.spec.ts y accesibilidad.spec.ts. Configuración: frontend/playwright.config.ts. [Capturas revisadas](./capturas/README.md).

## Trazabilidad y límites

US1–US4 y E001-R01–R07 tienen evidencia para la variante de prototipo. T007 (API Catálogo real), T009 (composición de perfiles/reputación reales) y T012 (recorrido persistido) permanecen pendientes. La lógica local filtra fixtures; no mide EQ-01 ni confirma disponibilidad.

No se declara EQ-06 completo: falta solicitud real, red controlada y evaluación con cinco participantes. No es auditoría completa de accesibilidad ni compatibilidad en todos los navegadores. La tipografía externa tiene fallback; las ilustraciones SVG se sirven localmente. Error de consulta se induce de forma explícita desde /demo, no es una prueba de resiliencia del backend futuro.

La primera pasada tuvo cuatro fallos (dos anchos móviles, selector de alerta ambiguo y streaming con estado 200 para publicación inexistente); fueron corregidos. Se retiró loading del detalle para no iniciar streaming antes de determinar notFound. La segunda compilación pasó y las 13 pruebas posteriores aprobaron.
