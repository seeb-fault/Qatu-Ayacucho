# Validación — Coordinación por WhatsApp

## Recorrido manual

1. En Mi cuenta, guardar el WhatsApp `987 654 321` y marcar «Mostrar mi WhatsApp…».
2. Como proveedor sin WhatsApp, intentar publicar: aparece el aviso para registrarlo.
3. Enviar una solicitud: la tarjeta no muestra WhatsApp mientras está pendiente.
4. Aceptarla como proveedor: ambas partes ven «Escribir a … por WhatsApp» y el mensaje lleva el título y las fechas.

## Validación local de la etapa 1 (2026-11-15)

- Entorno: Windows, Node.js 24, PostgreSQL/PostGIS 17.5 en Docker, bases nuevas `_test`. No se modificó `.env`.
- Backend: `test/reservas/whatsapp.test.ts` aprobó 7 de 7: formato de Perú (con y sin +51, espacios o guiones; rechazo de fijos, cortos y extranjeros), estados que comparten contacto, perfil propio con número normalizado y consentimiento, borrado que retira el consentimiento, pendiente sin cotización 409 para ambas partes, cotización enviada con el número de cada contraparte, tercero 404, anónimo 401, sin consentimiento número nulo y cancelada 409.
- Publicación: `test/catalogo/persistencia.test.ts` comprueba 409 `WHATSAPP_REQUERIDO` sin número, 409 con número sin consentimiento y la publicación tras habilitarlo. `test/reservas/calendario.test.ts` y `persistencia.test.ts` registran el WhatsApp del proveedor antes de publicar; las cuatro suites aprobaron 32 de 32.
- La migración `usuarios/003-whatsapp` se aplicó, se revirtió y se volvió a aplicar.
- Interfaz revisada con la API simulada: botón verde con texto blanco en la tarjeta aceptada, enlace `https://wa.me/51987654321?text=…` con el título y las fechas, y el campo con prefijo +51 y consentimiento en Mi cuenta.
- Pendiente en CI: `frontend/tests/reservas/whatsapp.spec.ts` (sin botón mientras está pendiente; con botón tras la aceptación; sin desborde a 360 px).
