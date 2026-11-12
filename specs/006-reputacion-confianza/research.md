# Decisiones e investigación — Reputación y confianza

## Evidencia local

ADR-002, ADR-007, ADR-012 gobiernan esta entrega. HU10, HU14, HU17, HU18 y RF11, RF15, RF18, RF19, RF20 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Nombre técnico resenas; confianza no se separa en otro módulo.
- Reseña de cliente participante con reserva FINALIZADA; única por cliente/reserva y puntuación 1–5.
- Archivos privados con etapa, autor, hash, fecha y tamaño; referencia a reserva válida y permisos en descarga.
- Garantía documental separada del cobro; estado no acredita custodia ni transferencia bancaria.

## D09 resuelta (2026-11-11, elegida por el usuario)

- **Evidencias:** hasta 4 fotos JPEG o PNG por etapa (entrega y devolución), de hasta 5 MiB cada una. Se validan cantidad, tamaño, MIME y firma, y se cifran con el mismo adapter que los documentos de verificación (003). Solo participantes de la reserva y administradores las descargan.
- **Retención:** se borran 90 días después del cierre de la reserva, salvo que haya una incidencia abierta; en ese caso se conservan hasta resolverla. Se conserva la metadata (etapa, autor, hash, fecha y tamaño) para el historial.
- **Incidencias:** las abre cliente o proveedor hasta 48 horas después de la devolución confirmada o del cierre del servicio. Las resuelve un administrador que no participa en la reserva, con un motivo de 10 a 500 caracteres. El resultado queda registrado y no mueve dinero.
- **Reseñas:** solo el cliente califica al proveedor, de 1 a 5, con comentario opcional, hasta 14 días después del cierre. Una reseña por reserva. Un administrador puede ocultarla con motivo; el promedio publicado se recalcula sin las ocultas.
- **Garantía documental:** acuerdo escrito sobre el estado de la herramienta y sus accesorios al entregarla, respaldado por las evidencias. No custodia dinero ni acredita transferencias.

## Decisiones de 006.3 (2026-11-12)

- **Garantía sin monto:** el modelo lógico proponía `montoCentimos`, pero un importe sugeriría un depósito o custodia que Qatu no realiza. La garantía es solo el texto acordado del estado y los accesorios, que el proveedor puede corregir hasta que el cliente da conformidad con la versión vigente.
- **Incidencias:** una abierta por reserva, con tipo (daño, faltante, servicio u otro) y descripción de 20 a 1000 caracteres; el administrador consulta las fotos de la reserva. Resultado a favor del cliente, a favor del proveedor o sin acuerdo; la resolución no se edita y no cambia pagos ni reservas.
- **Retención:** la limpieza no borra fotos de reservas con una incidencia abierta.
- **Pendiente:** avisar a los participantes de la apertura y la resolución, que requiere eventos de este módulo hacia la bandeja de avisos.

## Decisiones pendientes

- Avisos de incidencias a los participantes.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
