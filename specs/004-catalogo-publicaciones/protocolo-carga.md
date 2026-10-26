# Protocolo local de carga — Catálogo 004

Fecha de definición: 2026-10-26. Ensayo derivado de EQ-01/EQ-03, específico de Catálogo; no sustituye el escenario global ni una evaluación en VPS.

- Base PostgreSQL exclusiva y local, nombre terminado en `_load_test`. El programa rechaza bases de desarrollo/producción y no borra ni trunca tablas.
- Fixture: 100 cuentas/proveedores sintéticos, 1000 publicaciones (500 herramientas, 500 servicios), 1500 recursos. Cien publicaciones inactivas y cien retiradas por moderación; 800 públicas. Perfiles aprobados/públicos precargados solo para medir lectura; no valida revisión documental mediante estos fixtures.
- API NestJS compilada en 3301 y proxy Next.js de producción en 3310, con build separado `.next-carga`. No se cargan los puertos 3001/3002 de desarrollo.
- Cinco minutos de calentamiento con 30 usuarios; quince minutos medidos: cinco a 10 usuarios, cinco a 30 y cinco a 60. Modelo cerrado con espera de 250 ms entre peticiones por usuario. El informe incluye throughput para interpretar la carga realmente aplicada.
- Mezcla: 70 % búsqueda convencional con texto, filtros AND, presupuesto, orden y paginación; 30 % detalle. Sin reservas simuladas: la mezcla global 70/20/10 y las 5000 reservas se ensayan en 005 cuando exista ese módulo.
- Cada respuesta se valida: HTTP 200, máximo 20 resultados, moneda/unidad coherentes, recursos activos y ausencia de datos privados. La corrección se registra por separado de errores técnicos.
- Tiempos completos desde el cliente a través del proxy, leyendo el cuerpo: p50/p95/p99 (histograma de 1 ms), throughput y errores. Error técnico: 5xx, conexión fallida o timeout de 10 s. También se registran otros códigos inesperados y fallos de contrato.
- Objetivos derivados, solo locales: p95 ≤ 1000 ms a 10/30 usuarios y ≤ 2000 ms a 60; errores técnicos < 1 % y cero fallos de contrato. Las muestras de calentamiento se excluyen.
- Registrar CPU/RAM de host, API, Next y generador, conexiones/configuración PostgreSQL, muestra Docker cuando esté disponible, versiones, commit y SHA-256 del código. Generador, proxy, API y PostgreSQL comparten el equipo: no extrapolar resultados a capacidad de un VPS.
- Se conserva el informe JSON y un resumen Markdown. El modo corto de diagnóstico nunca cuenta como aceptación de carga.

Comandos desde backend (tras instalar dependencias y crear/migrar una base exclusiva; nunca usar la base qatu de desarrollo):

```powershell
$env:BENCH_DATABASE_URLnpm run carga:preparar
$env:BENCH_DATABASE_URL = 'postgresql://USUARIO:CLAVE@127.0.0.1:5433/qatu_catalogo_load_test'
npm run test:carga:catalogo -- --warmup-seconds 2 --stage-seconds 5 --output ../.local-reconstruccion/carga-diagnostico.json
npm run test:carga:catalogo -- --output ../specs/004-catalogo-publicaciones/evidencias/carga-local.json
```

Cierre: T023/T027 distinguen medición local de Catálogo de aceptación global de carga. La revisión humana y EQ-06 con cinco participantes no se sustituyen por automatización. D02, mapas y pagos conservan sus pendientes propios.

El preparador compila backend y frontend con salida .next-carga, y conserva los archivos next-env.d.ts y tsconfig.json originales. Antes de medir, aplicar npm run migrate con DATABASE_URL apuntando únicamente a la base aislada. El runner exige 80 ofertas públicas por categoría, no borra datos y rechaza un fixture distinto. La ejecución de diagnóstico prepara el corpus y valida servidores; el ensayo completo reutiliza ese mismo corpus.
