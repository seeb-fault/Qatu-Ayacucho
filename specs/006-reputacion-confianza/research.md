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

## Decisiones pendientes

- Ninguna para 006.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
