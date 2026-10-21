# Modelo de datos — Catálogo y publicaciones

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Esta vista pertenece a catalogo; no es una migración aplicada.

## Datos propios

publicaciones; categorias; recursos; tarifas.

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| publicacion | id, proveedorId, tipo, categoriaId, zonaId, titulo, descripcion, activa, version | tipo/categoría compatibles; solo estado activo público |
| recurso | id, publicacionId, clase, identificador, activo | ID estable por unidad física/agenda |
| tarifa | id, publicacionId, montoCentimos, moneda, unidad, modalidad | PEN; monto entero no negativo; cotización variable sin total inventado |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Proveedor activo/verificado para publicar; validar propietario también al editar.
2. Cada unidad física tiene recursoId estable; el servicio referencia una agenda. Catálogo describe y Reservas bloquea.
3. Tipo herramienta/servicio y categoría compatibles; importes enteros en céntimos PEN y unidad explícita.
4. Solo publicaciones activas se descubren públicamente; cambios no reescriben snapshots previos de reserva.
5. Búsqueda textual y filtros/indexación antes de Redis; no se crean embeddings obligatorios.

## Fronteras

ConsultaCatalogo: ofertas activas, recurso estable y datos de tarifa para snapshot. No autoriza reservas ni escribe bloqueos.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

Confirmar columnas y estados contra contratos antes de generar migraciones. Toda ampliación respecto al modelo lógico se registra como propuesta y se sincroniza; no se presenta como dato ya implementado.
