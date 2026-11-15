# Investigación — Mi lista

## Decisiones

- **Sesión obligatoria para guardar (2026-11-14, Santiago Noe).** La lista vive en la cuenta, como las solicitudes, reservas y avisos. Una lista solo en el navegador se pierde al cambiar de dispositivo y obliga a fusionar listas al ingresar, que es donde suelen aparecer errores. Para enviar solicitudes ya se exige sesión, así que pedirla al guardar adelanta un paso inevitable. A diferencia de una tienda de productos, cada pedido en Qatu depende de la aceptación del proveedor, por lo que no se pierde una venta inmediata.
- **Regreso a la publicación.** Para que pedir la sesión no corte el flujo, el visitante vuelve a la publicación con el ítem agregado. La intención se guarda en `sessionStorage` (no contiene datos sensibles) y la ruta de regreso viaja como `?siguiente=`. Solo se aceptan rutas internas relativas para evitar una redirección abierta.
- **Sin módulo nuevo.** Un ítem de la lista es una solicitud en borrador, y las solicitudes pertenecen a Reservas. Se mantienen los 7 módulos acordados (ADR de módulos, separación de Pagos).
- **Sin bloqueo de fechas.** Separar fechas al guardar bloquearía herramientas sin compromiso. Se separan solo cuando el proveedor acepta, como en 005.
- **Una solicitud por ítem en la etapa 1.** Reutiliza el caso de uso existente con todas sus validaciones. Agrupar los ítems del mismo proveedor en una sola solicitud cambia el modelo de solicitud y queda para la etapa 2.
- **Pago conjunto diferido.** Hoy cada pago corresponde a una sola reserva (005.8). Pagar varias juntas exige reparto por proveedor en Pagos y se especificará con la fase de pagos (Culqi real, liquidación del modelo A).
- **Tarifa vista.** Se guarda la tarifa que el cliente vio para avisar si cambió; la solicitud usa siempre la tarifa vigente, como hoy con `tarifaEsperadaCentimos`.

## Alternativas descartadas

- Carrito anónimo en el navegador con fusión al ingresar: más código y casos de conflicto, sin beneficio claro en Qatu.
- Crear solicitudes al agregar: avisaría a proveedores por intenciones aún no confirmadas.

## Decisiones de implementación (2026-11-15)

- Límite de 20 ítems con candado por cliente (`pg_advisory_xact_lock`); retención de 30 días para ítems vencidos, aplicada al consultar la lista.
- Los oficios guardan su agenda como unidad (`recurso_id`), igual que una solicitud de 005; así el envío reutiliza el caso de uso sin cambios.
- El envío saca cada ítem con `DELETE … RETURNING` antes de crear su solicitud y lo restaura si la solicitud se rechaza. Si el proceso se cae entre ambos pasos, el ítem se pierde pero nunca se duplica una solicitud.
- Si la tarifa cambió, el cliente acepta la nueva con `POST /lista/items/:id/tarifa`; la solicitud siempre se crea con la tarifa vista y 005 rechaza si no coincide.
- Sin llaves foráneas hacia Usuarios ni Catálogo: Reservas no las usa entre módulos.

## Decisiones pendientes

- Ninguna para la etapa 1.

## Resultado

Etapa 1 implementada sin cambios en Pagos ni en el modelo de solicitud.
