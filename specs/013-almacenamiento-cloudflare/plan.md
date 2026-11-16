# Plan — Almacenamiento y borde con Cloudflare

## Etapa 1 (013.1) — archivos privados en R2

- **Compartido (`src/shared/infraestructura`):**
  - `almacen.ts`: interfaz `AlmacenObjetos`; `AlmacenR2` (S3 con firma SigV4, región `auto`); `AlmacenMemoria` para pruebas; `crearAlmacen` lee `QATU_ALMACEN`.
  - `archivos-externos.ts`: subir antes de la transacción, descartar si no se confirma, leer el contenido esté donde esté y vaciar la cola `objetos_por_borrar` con reintentos.
  - `almacen.module.ts`: módulo global de Nest con un almacén por proceso; vacía la cola al arrancar y cada 5 minutos.
- **Proveedores y reputación:** los repositorios reciben `ArchivosExternos`; guardan `objeto` en vez de `contenido` cuando hay almacén; la purga y la retención encolan el objeto en la misma transacción. La disponibilidad se decide por `eliminado_en`, no por `contenido`.
- **Migraciones:** `compartido/001-objetos-por-borrar`, `proveedores/003-almacen-objetos`, `resenas/005-almacen-objetos`, con `.down` que se niega si hay archivos en el almacén.
- **Scripts:** `npm run archivos:mover [-- --simular]` mueve los archivos existentes; `restauracion:verificar` lee el almacén configurado.
- **Pruebas:** `test/almacen/almacen.test.ts` (memoria y, con `QATU_R2_PRUEBAS=1`, R2 real); `test/entorno-pruebas.ts` fuerza PostgreSQL en `npm test`; las suites de navegador usan `QATU_ALMACEN=memoria`.
- **Privacidad:** Cloudflare como encargado y transferencia internacional.

## Etapa 2 — fotos públicas

Subida de fotos de publicaciones al bucket público, dominio propio en la CDN de Cloudflare, `img-src` y `next/image` actualizados.

## Etapa 3 — Cloudflare delante

DNS del dominio en Cloudflare, proxy con SSL Full (strict), WAF y límites, `forwardedHeaders.trustedIPs` de Traefik con los rangos de Cloudflare, IP real en la API y Turnstile en ingreso, registro y Libro de Reclamaciones.
