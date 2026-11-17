# Validación — VPS

Sin despliegue todavía. Completar comandos reales de construcción, migración y arranque una vez implementados.

1. Registrar commit, versiones y recursos; preparar dataset EQ (1000 publicaciones,100 proveedores,5000 reservas sintéticas).
2. Verificar configuración y smoke de web/API/PostgreSQL privado.
3. Ejecutar 5 min de calentamiento y 15 de carga a 10/30/60 usuarios con mezcla EQ.
4. Probar reinicio de proceso sin perder volúmenes.
5. Restaurar copias DB/archivos en entorno vacío; medir RPO/RTO y verificar referencias/conciliación.
6. Ejecutar recorrido público → autenticación → solicitud → aceptación → pago sandbox → cierre → reseña.

Resultados: pendientes. Registrar p50/p95/p99, errores, recursos y costos. No confundir simulación de tercero con integración real ni reinicio de proceso con recuperación de host.

## Validación local de los artefactos (2026-11-16)

Despliegue simulado en Windows con Docker Desktop, con el mismo `infra/compose.production.yml` que usará Dokploy, en un proyecto aislado (`qatu-prueba`) y con secretos aleatorios de un solo uso.

- **Imágenes:** web 391 MB y api 362 MB, Node 24, usuario sin privilegios. Construidas una a la vez: en paralelo, una descarga de npm se cortó por la red (`ECONNRESET`), sin relación con los Dockerfiles.
- **Arranque:** db, api y web quedaron *healthy*. La API aplicó las migraciones al iniciar y escucha en `0.0.0.0` solo dentro de la red interna.
- **Prueba de humo desde la red de Docker:**
  - `/api/v1/salud` y la reescritura `/api/v1` de la web: 200.
  - Portada, `/terminos`, `/libro-de-reclamaciones`, `/buscar` e `/ingresar`: 200.
  - Cabeceras: CSP y `X-Frame-Options: DENY`, sin `X-Powered-By`.
  - Origen ajeno: 403. Registro con el origen correcto: 201, con cookie `Secure`.
- **Aislamiento:** ningún puerto publicado; db y api solo en la red interna; únicamente web en `dokploy-network`.
- **Prueba automática:** `test/compartido/salud.test.ts` (vida, lista con PostgreSQL real, sin datos sensibles).
- **Pendiente:** el despliegue real en la EC2 (`infra/runbooks/despliegue.md`), la copia manual a R2 y las mediciones EQ desde fuera del servidor.
