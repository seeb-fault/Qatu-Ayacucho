# Validación — Mi lista

Estado: etapa 1 verificada en backend y en interfaz con datos simulados (2026-11-15); el recorrido de navegador completo corre en CI.

## Recorrido manual

1. Sin sesión, abrir una herramienta, elegir fechas y tocar «Agregar a mi lista»: debe pedir el ingreso.
2. Iniciar sesión: debe volver a la publicación con el mensaje «Agregado a tu lista» y el contador en 1.
3. Agregar un oficio de otro proveedor con una descripción de al menos 20 caracteres.
4. Abrir `/lista`: los ítems aparecen agrupados por proveedor, con tarifa y estado.
5. Tocar «Enviar solicitudes»: cada proveedor ve su solicitud y la lista queda vacía.

## Casos negativos

- `/ingresar?siguiente=//ejemplo.com` vuelve al destino por tipo de cuenta.
- Agregar la propia publicación (403), un duplicado o el ítem 21 (409).
- Pedir la lista o borrar un ítem de otra cuenta (404).
- Repetir el envío con la misma clave: no crea solicitudes nuevas.

## Validación local de la etapa 1 (2026-11-15)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS 17.5 en Docker, bases nuevas `_test`. No se modificó `.env`.
- Backend: `npm test` aprobó 182 de 182. `test/reservas/lista.test.ts` (9 de 9) cubre en dominio las fechas, los cinco estados de revisión y la huella del envío; con PostgreSQL real: 401 sin sesión, 403 al guardar la propia oferta, guardar sin crear solicitudes, duplicado 409, lista privada (otra cuenta ve una lista vacía y recibe 404 al borrar o aceptar tarifa), estados tarifa cambiada, fechas vencidas y unidad ocupada por una reserva aceptada, aceptar la tarifa nueva, envío que crea una solicitud y deja el vencido con su motivo, repetición con la misma clave sin solicitudes nuevas, la misma clave con otro pedido 409, dos envíos simultáneos con una sola solicitud y límite de 20 ítems.
- La migración `reservas/011-lista` se aplicó, se revirtió y se volvió a aplicar.
- Interfaz: `/lista` revisada con la API simulada a 1440 y 390 px sin desborde, con los estados listo, tarifa cambiada, ocupada y oficio, y el resultado de un envío parcial. `npm test` (descubrimiento) 14 de 14 y `next build` correcto.
- Pendiente en CI: `frontend/tests/reservas/lista.spec.ts` (visitante que guarda, ingresa, vuelve con el ítem agregado y envía; rutas de regreso maliciosas). Localmente necesita el puerto 3001, ocupado por el backend de desarrollo.
