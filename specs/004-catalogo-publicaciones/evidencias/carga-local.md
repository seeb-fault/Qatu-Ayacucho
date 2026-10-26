# Resultado de carga local — Catálogo 004

- Tipo: **carga-local**. Estado: **completado**. Objetivos locales: **cumplidos**.
- Inicio: 2026-10-26T06:24:49.594Z; fin: 2026-10-26T06:44:57.917Z.
- Commit inicial: 73ba16b3c0af04acc8e9704afc759e9d2fe613f5; árbol de trabajo con documentación/evidencias pendientes al inicio: sí; las fuentes medidas corresponden al commit indicado.
- SHA-256 de fuentes: 949b8d4fa0638cab9aa63ac08a342a6cd911afb40b8f85c5726862daa79bfa3d; sin modificaciones durante la medición: sí.
- Build Next.js: LgG9TqT40ZqLI3XmPocrA.

## Condiciones

Host win32 10.0.26300, AMD Ryzen 5 3500U with Radeon Vega Mobile Gfx  , 8 procesadores lógicos, 10187.6 MiB RAM. Node v24.21.0.

PostgreSQL: PostgreSQL 17.5 (Debian 17.5-1.pgdg110+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 10.2.1-6) 10.2.1 20210110, 64-bit. max_connections=100; shared_buffers=128MB; work_mem=4MB; effective_cache_size=4GB.

Base aislada: qatu_catalogo_load_test. 100 proveedores, 1000 publicaciones, 1500 recursos; 800 ofertas públicas.

Tráfico por proxy Next.js 3310 hacia API 3301. Calentamiento: 300s; cada escalón: 300s; espera entre peticiones por usuario: 250ms. Mezcla 70% búsqueda y 30% detalle; límite 20 resultados.

## Medidas desde el proxy

| Usuarios | Peticiones | req/s | p50 ms | p95 ms | p99 ms | Errores técnicos | Fallos contrato | Objetivo local |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 10 | 10521 | 35.07 | 26 | 51 | 79 | 0 (0%) | 0 | PASS |
| 30 | 29068 | 96.84 | 47 | 122 | 177 | 0 (0%) | 0 | PASS |
| 60 | 35768 | 119.14 | 244 | 388 | 464 | 0 (0%) | 0 | PASS |

## Recursos y límites

- API: 1198 muestras; pico RSS 206.1 MiB; pico CPU 107.3% de un núcleo.
- Next.js: 1197 muestras; pico RSS 154.7 MiB; pico CPU 85.8% de un núcleo.
- PostgreSQL: máximo 20 conexiones en la base aislada; máximo 0 conexiones esperando locks.
- 10 usuarios: CPU total del host 37.26%; p95 del event loop del generador 32.26ms; CPU del generador 7.6% de un núcleo.
- 30 usuarios: CPU total del host 78.54%; p95 del event loop del generador 31.98ms; CPU del generador 28.71% de un núcleo.
- 60 usuarios: CPU total del host 98.36%; p95 del event loop del generador 30.85ms; CPU del generador 41.78% de un núcleo.

- Ensayo local compartiendo host; no VPS
- Sin Reservas, sin 5000 reservas y sin mezcla global 70/20/10
- No acredita EQ-06 con cinco participantes
- Los escalones son cinco minutos cada uno en el protocolo completo; no equivalen a quince minutos independientes por nivel.
- EQ-01/EQ-03 globales, mezcla con Reservas, infraestructura VPS y aceptación humana de EQ-06 siguen pendientes.
- No se prueba disponibilidad para alquiler ni se ejecutan cobros.

El JSON adyacente conserva histogramas resumidos, muestras de recursos, distribución de estados y huella del código. Un diagnóstico corto no es aceptación de rendimiento.
