# Validación — Almacenamiento y borde con Cloudflare

## Activar R2 en desarrollo

1. En `backend/.env`, con las variables `QATU_R2_*` ya completas, agregar `QATU_ALMACEN=r2`.
2. `npm run migrate` y reiniciar el backend.
3. Hacer una copia de la base de desarrollo.
4. Mover los archivos existentes: `npm run archivos:mover -- --simular` para ver cuántos hay, y `npm run archivos:mover` para moverlos.
5. Verificar: `npm run restauracion:verificar`, que debe leer y descifrar cada archivo desde R2.

## Recorrido manual

1. Como proveedor, enviar la documentación de verificación; como administrador, abrir un documento.
2. En una reserva en curso, subir una foto de entrega y descargarla.
3. En el panel de R2, el bucket privado muestra objetos `proveedores/documentos/…` y `resenas/evidencias/…`. Descargados desde el panel, son ilegibles porque están cifrados.

## Validación local de la etapa 1 (2026-11-16)

- **Entorno:** Windows, Node.js 24, PostgreSQL/PostGIS 17.5 en Docker, bases nuevas `_test`; Cloudflare R2 con los buckets `qatu-*-dev`.
- **`test/almacen/almacen.test.ts`: 11 de 11, incluida la prueba contra R2 real** (`QATU_R2_PRUEBAS=1`: subir 4 KB, leerlos idénticos, borrar, 404 después).
  - Configuración: PostgreSQL por defecto, R2 solo si se pide, `memoria` prohibida en producción.
  - Firma SigV4 y códigos HTTP.
  - Con PostgreSQL real:
    - La fila guarda solo la clave y el almacén guarda los mismos bytes cifrados.
    - Un fallo al subir no registra nada.
    - Un cupo superado después de subir descarta los objetos.
    - La retención encola el borrado y reintenta tras un fallo simulado.
    - Los documentos de proveedor se suben, se leen y se purgan por la cola.
    - La base rechaza contenido y objeto a la vez, o ninguno.
    - `migrarArchivos` simula, mueve, verifica y es idempotente.
    - El verificador de restauración detecta un objeto faltante o un almacén sin configurar.
- **Backend completo: 224 de 224** (1 omitida: la de R2 real, ejecutada aparte).
  - Al validar se encontró un fallo: `scripts/limpiar-documentos.ts` arrancaba Proveedores sin el módulo del almacén. Se corrigió, y el cierre de la aplicación ahora espera la ronda de borrado en curso.
- **Migraciones:** `compartido/001-objetos-por-borrar`, `proveedores/003-almacen-objetos` y `resenas/005-almacen-objetos` aplicadas, revertidas y reaplicadas.
- **Navegador: 8 suites, 48 de 48, con `QATU_ALMACEN=memoria`.** Las subidas y descargas de documentos (proveedores) y de fotos (reseñas) recorren el almacén externo.
- **Desarrollo (con copia previa de la base):** con `QATU_ALMACEN=r2`, la simulación encontró 2 documentos de proveedor. `archivos:mover` los movió a R2 (2 movidos, 0 pendientes, sin errores) y `restauracion:verificar` los leyó desde R2, los descifró y confirmó su hash (2 vigentes, 2 verificados, sin problemas).
