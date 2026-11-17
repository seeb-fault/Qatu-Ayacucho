# Investigación — Almacenamiento y borde con Cloudflare

## Punto de partida (2026-11-16)

Los documentos de verificación (003) y las fotos de evidencia (006.2) se guardaban cifrados como `bytea` en PostgreSQL, hasta 5 MiB por archivo. Funciona, pero engorda la base, sus copias y el tiempo de restauración (AC09). Las publicaciones todavía usan ilustraciones de referencia.

## Decisiones (2026-11-16, Santiago Noe)

- **Cloudflare R2.** Compatible con S3, sin cobro por descargas y con 10 GB gratis al mes. Exige un medio de pago aunque no se supere el plan gratuito; se recomendó una tarjeta virtual con límite bajo y una alerta de presupuesto.
- **Cifrado en Qatu, no en R2.** Se mantiene AES-256-GCM con `DOCUMENTOS_KEY` y el id del archivo como dato autenticado. R2 solo guarda bytes cifrados; ni Cloudflare ni quien obtenga el token puede leer un DNI.
- **Cliente S3 propio en vez del SDK de AWS.** Solo se necesitan PUT, GET y DELETE de un objeto; la firma SigV4 son unas 30 líneas con `node:crypto` y `fetch`, frente a decenas de paquetes del SDK. Se validó contra R2 real (subir, leer idéntico, borrar, 404 tras borrar, 403 al listar o crear buckets). Si más adelante hacen falta subidas multiparte o URL prefirmadas, se reemplaza por el SDK detrás de la misma interfaz.
- **`QATU_ALMACEN` explícito.** Tener las llaves en el `.env` no activa R2: hay que pedirlo. Así `npm test`, el CI y las suites de navegador nunca salen a internet ni dejan objetos en el bucket de desarrollo.
- **Cola de borrado en la base.** Borrar un objeto de R2 dentro de una transacción de PostgreSQL no es atómico. Por eso, retirar el archivo y encolar su objeto van en la misma transacción, y un proceso borra después con reintentos. Un fallo de red nunca deja un documento olvidado en el bucket.
- **Subir antes de registrar.** Se sube el objeto antes de la transacción que lo registra; si esta falla, el objeto se descarta por la cola. Al revés quedarían filas que apuntan a objetos inexistentes.
- **Restricción en la base.** Un archivo vigente tiene contenido en la base o en el almacén, nunca en ambos ni en ninguno: así la migración y el código no pueden dejar estados ambiguos.
- **Migración verificada.** Cada archivo se sube, se relee, se compara byte a byte y recién entonces se vacía su columna, solo si la fila no cambió.
- **Transferencia internacional (Ley 29733).** Los servidores de Cloudflare están fuera del Perú; la política de privacidad lo informa y nombra a Cloudflare como encargado.

## Configuración en Cloudflare (registrada el 2026-11-16)

- Buckets `qatu-privado-dev` y `qatu-publico-dev`, ubicación automática, clase Standard, sin acceso público.
- Token de cuenta `qatu-backend-dev`: «Object Read & Write» solo sobre esos dos buckets.
- Comprobado sin mostrar las llaves:
  - subir, leer (bytes idénticos) y borrar en ambos buckets;
  - acceso anónimo rechazado;
  - el token no lista los buckets de la cuenta ni crea otros (403).
- Pendiente del equipo: verificación en dos pasos de la cuenta de Cloudflare, alerta de presupuesto y buckets de producción con su propio token.
