# Investigación — Información legal y Libro de Reclamaciones

## Fuentes (consultadas el 2026-11-16)

- **DS 101-2022-PCM**, texto en El Peruano (https://busquedas.elperuano.pe/api/visor_html/2095978-1):
  - Respuesta a reclamos y quejas en un plazo no mayor a 15 días hábiles, por escrito, por carta o correo, según lo pida el consumidor.
  - Suspensión de hasta 5 días hábiles si el proveedor ofrece una solución.
  - La atención no puede condicionarse a un pago previo.
  - Definición de **queja**: disconformidad no relacionada con los bienes o servicios, o malestar respecto a la atención al público.
- **Garrigues**, nota del 25/08/2022, confirma el plazo de 15 días hábiles y la suspensión de 5.
- **Requisitos de URL de Culqi**, mostrados en su registro de comercio y copiados por el equipo el 2026-11-16:
  - Productos o servicios con foto, descripción y precio.
  - Contacto con número, correo y dirección.
  - Términos y condiciones, y política de cambios o devoluciones.
  - Libro de Reclamaciones integrado según INDECOPI, sin formularios, enlaces ni archivos externos.
  - Carrito o botón de compra, credenciales de prueba y SSL en todas las URL.

## Lo que no se pudo confirmar con fuente oficial

El anexo con el formato oficial de la Hoja de Reclamación no aparece en el texto del decreto en El Peruano. Los campos de M012-FR01 siguen la lista habitual del formato, tomada de una fuente secundaria:
- correlativo, fecha, datos del proveedor y del consumidor (y de padre o madre si es menor);
- bien contratado y monto;
- tipo, detalle y pedido;
- acciones del proveedor.

**Antes de producción debe contrastarse con el formato vigente de INDECOPI.** Tampoco se confirmó con fuente oficial cuánto tiempo deben conservarse las hojas, por lo que nunca se borran.

## Decisiones (2026-11-16, Santiago Noe)

- **Sin módulo nuevo.** El libro vive en Reputación y confianza, junto a las incidencias: ambos atienden problemas con una operación.
- **Sin cuenta obligatoria.** El libro es un derecho del consumidor; exigir registro sería una barrera. Con sesión, la hoja se vincula a la cuenta.
- **Constancia en pantalla e impresión.** No hay proveedor de correo todavía; la constancia se muestra completa al enviar y se puede imprimir o guardar en PDF. El código de consulta permite volver a verla con la respuesta.
- **Plazo conservador.** Se cuentan 15 días hábiles sin descontar feriados: el plazo mostrado nunca es más largo que el legal.
- **Cuota por documento.** Detrás del proxy de Next todas las peticiones llegan desde 127.0.0.1, así que una cuota por IP sería global. Se limita por documento (3 cada 15 min), con un tope amplio por IP (60).
- **Titular configurable.** La razón social, el RUC, la dirección, el correo y el teléfono no se inventan: vienen de `QATU_TITULAR_*` y se muestran como «Por definir» mientras falten.
- **Textos legales según el código.** Cada regla de los términos y de la política de devoluciones se comprobó contra el comportamiento implementado (005, 006, 010, 011).

## Hallazgo relacionado: la IP real detrás del proxy

El límite de intentos de inicio de sesión (`ip:<ip>:login`, 30 cada 15 min) usaba `request.ip`. Detrás del proxy de Next todas las peticiones llegan desde 127.0.0.1, así que el límite era común a todo el sitio: 30 intentos fallidos de cualquiera bloqueaban el ingreso de todos durante 15 minutos.

Se revisó el código de Next 16 (`proxy-request.js` y `httpxy`): su proxy **no agrega** `X-Forwarded-For` (no usa `xfwd`) y reenvía la del visitante. Confiar en esa cabecera solo con Next delante permitiría falsificar la IP y saltarse el límite.

Corrección (2026-11-16): la API confía en `X-Forwarded-For` solo si `QATU_PROXIES_CONFIABLES` lo indica, pensado para el proxy inverso del despliegue (008): Traefik en Dokploy, con `uniquelocal` porque la web y la API van en contenedores distintos. La API admite además `QATU_HOST=0.0.0.0` para escuchar en la red interna de Docker; por defecto sigue en 127.0.0.1. Sin la variable el comportamiento no cambia y nadie puede falsificar su IP. Ver `backend/src/shared/infraestructura/proxies.ts`, `backend/test/usuarios/proxies.test.ts` y [despliegue en VPS](../../docs/04-modelo-c4/despliegue-vps.md).
