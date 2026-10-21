# Modelo de datos — Reputación y confianza

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Esta vista pertenece a resenas; no es una migración aplicada.

## Datos propios

resenas; garantias_documentadas; evidencias; incidencias.

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| resena | id, reservaId, clienteId, proveedorId, puntuacion, texto, moderacion | 1–5; UNIQUE(clienteId,reservaId); reserva finalizada |
| evidencia | id, reservaId, autorId, etapa, rutaPrivada, hash, tipo, bytes, fecha | tipo/tamaño permitidos; descarga autorizada |
| garantia_documentada | id, reservaId, montoCentimos, condiciones, estado | reservaId UNIQUE; sin custodia |
| incidencia | id, reservaId, autorId, motivo, estado, resolucion, revisorId | resolución humana auditada |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Nombre técnico resenas; no crear séptimo módulo para confianza.
2. Reseña de cliente participante con reserva FINALIZADA; única por cliente/reserva y puntuación 1–5.
3. Archivos privados con etapa, autor, hash, fecha y tamaño; referencia a reserva válida y permisos en descarga.
4. Garantía documental separada del cobro; estado no acredita custodia ni transferencia bancaria.
5. Incidencias se resuelven por humano autorizado; la IA de búsqueda no califica daños.
6. Reservas decide estados de operación; Reputación consulta contratos/eventos y no modifica tablas de Reservas.

## Fronteras

RegistroConfianza y lectura de reputación; ConsultaReservas para participantes/estado; almacén privado por adapter.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

Confirmar columnas y estados contra contratos antes de generar migraciones. Toda ampliación respecto al modelo lógico se registra como propuesta y se sincroniza; no se presenta como dato ya implementado.
