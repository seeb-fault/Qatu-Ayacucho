# 013 — Almacenamiento y borde con Cloudflare

**Estado:** etapa 1 (013.1) implementada: archivos privados en Cloudflare R2. Etapas 2 y 3 pendientes. **Fecha:** 2026-11-16.
**Módulos técnicos:** compartido (almacén y cola de borrado), proveedores (documentos de verificación), reputación y confianza (`resenas`: evidencias). **Historias:** pedido del equipo, 2026-11-16.

## Objetivo y alcance

Sacar de PostgreSQL los archivos cifrados (documentos de proveedores y fotos de evidencia) y guardarlos en Cloudflare R2, sin perder privacidad, retención ni capacidad de restauración. Después, servir las fotos públicas desde la CDN y poner Cloudflare delante de la web.

- **Etapa 1 (013.1):** almacén compatible con S3 detrás de una interfaz (`postgres`, `r2` o `memoria`); evidencias y documentos se cifran en Qatu y se suben a R2; cola de borrado confiable; migración de los archivos existentes; verificación de restauración con el almacén.
- **Etapa 2:** fotos de las publicaciones en el bucket público, con dominio propio y CDN (requiere el dominio en Cloudflare).
- **Etapa 3:** Cloudflare como proxy delante de Traefik (WAF, DDoS, SSL Full strict), IP real con los rangos de Cloudflare y Turnstile en formularios públicos.

## User Scenarios & Testing

### US1 — Archivos privados fuera de la base (P1)

Como operador, quiero que los documentos y las fotos no engorden la base ni sus copias.
**Prueba independiente:** Dado `QATU_ALMACEN=r2`, cuando un proveedor envía su documentación o un participante sube una foto, entonces la fila guarda solo la clave del objeto y R2 contiene los mismos bytes cifrados; al descargarla se descifra igual que antes.
**Caso negativo:** si R2 falla al subir, no se registra nada; si la transacción falla después de subir, los objetos se borran del almacén.

### US2 — Retención y purga sin olvidos (P1)

Como titular de los datos, quiero que mis documentos y fotos se borren de verdad cuando corresponde.
**Prueba independiente:** Dado una evidencia vencida (90 días) o los documentos de una cuenta inactiva, cuando se retiran, entonces su objeto entra en `objetos_por_borrar` en la misma operación y la cola lo borra de R2.
**Caso negativo:** si R2 falla al borrar, el objeto queda en la cola con el intento y el error, y se reintenta.

### US3 — Mover lo existente y restaurar (P1)

Como operador, quiero pasar a R2 los archivos que ya están en PostgreSQL y saber si una restauración está completa.
**Prueba independiente:** Dado archivos en la base, cuando corro `npm run archivos:mover`, entonces cada uno se sube, se relee, se compara y recién entonces se vacía su columna; repetirlo no hace nada. El verificador de restauración lee los objetos de R2 y descifra cada archivo.
**Caso negativo:** un objeto que falta en R2 se informa como problema de la restauración.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad |
|---|---|---|
| M013-FR01 | Qatu cifra con AES-256-GCM y `DOCUMENTOS_KEY` antes de subir; el IV y la etiqueta quedan en PostgreSQL. R2 nunca recibe contenido legible. | Privacidad, Ley 29733 |
| M013-FR02 | Un archivo vigente tiene su contenido en PostgreSQL **o** en el almacén, nunca en ambos ni en ninguno; uno retirado no tiene ninguno. Lo garantiza la base con restricciones. | Integridad |
| M013-FR03 | Retirar un archivo y encolar su objeto ocurren en la misma transacción; la cola se vacía al retirar y cada 5 minutos, con reintento y registro del error. | Retención D09, AC09 |
| M013-FR04 | `QATU_ALMACEN` decide el almacén: `postgres` por defecto; `r2` solo si se pide; `memoria` solo en pruebas y nunca en producción. `npm test` fuerza `postgres` aunque el `.env` pida R2. | Seguridad, pruebas sin internet |
| M013-FR05 | El token de R2 tiene solo «Object Read & Write» sobre los buckets de Qatu: no lista la cuenta ni crea buckets. Las llaves viven en el `.env`, nunca en el código. | Mínimo privilegio |
| M013-FR06 | La política de privacidad informa a Cloudflare como encargado y la transferencia internacional de datos. | Ley 29733 |

## Key Entities

Columna `objeto` en `evidencias` y `documentos_proveedor`; tabla `objetos_por_borrar`. Ver [modelo](./data-model.md) y [contrato](./contracts/api.md).

## Edge Cases

- Cupo de fotos superado después de subir: la transacción falla y los objetos subidos se descartan por la cola.
- Un archivo en R2 con `QATU_ALMACEN` vacío: la lectura falla con un error claro y el verificador de restauración lo informa.
- La migración encuentra una fila retirada entre la subida y la actualización: no la toca y borra el objeto sobrante.

## Success Criteria

- SC01: US1–US3 con PostgreSQL real y contra Cloudflare R2 real.
- SC02: las suites de navegador de proveedores y evidencias pasan con el almacén externo.
- SC03: ningún objeto queda en R2 tras retirarse su archivo, aun con fallos del almacén.

## Clarifications

- Decidido (2026-11-16): Cloudflare R2 por no cobrar descargas y ser compatible con S3; buckets `qatu-privado-*` y `qatu-publico-*` por entorno; token de cuenta con permiso solo sobre ellos.
- Decidido (2026-11-16): cliente S3 propio (PUT, GET, DELETE firmados con SigV4) en lugar del SDK de AWS; ver [investigación](./research.md).

## Dependencies

[003-proveedores-verificacion](../003-proveedores-verificacion/spec.md) · [006-reputacion-confianza](../006-reputacion-confianza/spec.md) · [008-despliegue-validacion](../008-despliegue-validacion/spec.md) · [012-legal-reclamaciones](../012-legal-reclamaciones/spec.md) (privacidad).

## Artifacts

[Plan](./plan.md) · [Investigación](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).
