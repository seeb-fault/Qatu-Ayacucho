# Modelo de datos — Búsqueda inteligente

**Fuente:** [modelo lógico Qatu](../../docs/03-diseño-de-software/modelo-de-datos.md). Esta vista pertenece a busqueda; no es una migración aplicada.

## Datos propios

configuración de cuota y métricas agregadas; sin copia autoritativa de catálogo.

## Campos lógicos propuestos

| Entidad | Campos | Restricción |
|---|---|---|
| CriteriosBusqueda (valor) | tipo, categoriaId, zonaId, inicio, fin, precioMaximoCentimos | IDs reales; rango coherente; filtros manuales prevalecen |
| ContextoInterpretacion (valor) | fechaReferencia, zonaHoraria, deadline | reloj servidor/in­yectado; America/Lima |
| configuracion_cuota (propuesta) | actorAnonimizado, ventana, limite, consumido | límite atómico; sin texto sensible |
| metrica_agregada (propuesta) | ventana, modelo, modo, latencia, costo, resultadoValidacion | no almacenar evidencia privada ni secretos |

Los campos adicionales operativos son propuestas de detalle del modelo existente; nombres físicos y migraciones se fijan al implementar.

## Invariantes de persistencia y acceso

1. Salida del modelo es no confiable; validar esquema, límites e IDs contra catálogo y zonas reales.
2. Filtros manuales tienen prioridad; fechas relativas con reloj inyectado/contexto America/Lima; ambigüedad se muestra, no se inventa.
3. Modelo interpreta, backend consulta precio/disponibilidad. Sin SQL generado ni acciones de escritura.
4. Interpretación máximo 3 s y solicitud total 5 s como metas; cortar llamadas al vencer deadline.
5. 429, error, JSON inválido o cuota agotada activan búsqueda convencional; reservas/pagos no importan este módulo.
6. No enviar documentos, pagos ni evidencia privada al modelo; no guardar texto sensible completo en logs.

## Fronteras

BuscarEnLenguajeNatural; puerto InterpreteIntencion; consumo de ConsultaCatalogo y ConsultaDisponibilidad en modo lectura.

Las claves externas lógicas no conceden permiso para usar repositories de otros módulos. Toda migración define índices, constraints y compatibilidad de rollback. Se usarán céntimos enteros para dinero y UTC para instantes; las políticas comerciales pendientes no se deducen de esa representación. No guardar secretos ni datos completos de tarjeta.

## Cambios pendientes de esquema

Confirmar columnas y estados contra contratos antes de generar migraciones. Toda ampliación respecto al modelo lógico se registra como propuesta y se sincroniza; no se presenta como dato ya implementado.
