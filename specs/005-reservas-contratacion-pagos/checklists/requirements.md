# Checklist — Reservas, contratación y pagos

## Revisión documental

- [ ] Revisión humana de alcance HU03/HU04/HU05/HU06/HU07/HU08/HU09/HU19/HU20, requisitos RF04/RF05/RF06/RF07/RF08/RF09/RF10/RF18/RF21/RF22/RF23 y reglas locales.
- [ ] Resolver decisiones que bloqueen las tareas elegidas.
- [ ] Completar DTO y contratos propuestos sin cambiar silenciosamente docs.
- [ ] Verificar dependencia por fachadas y propiedad de datos.

## Aceptación funcional (pendiente)

Los incrementos 005.1/005.2 tienen alcance propio en contracts/api.md y tasks.md (T037–T046). Se verificaron solicitudes, rechazo, visita, aceptación concurrente de herramientas, vencimiento, efectivo bilateral y devolución. 005.3/005.4 agregan cotizaciones versionadas y agenda por recurso sin anticipo (T047–T054), separadas del pago. D05 está resuelta para herramientas; D06/D07 parcialmente resueltas. Ejecución/cierre de oficios, pasarela, notificaciones y evidencias entre módulos conservan sus pendientes D06–D08/D12. El efectivo confirmado por participantes no se presenta como pago bancario verificado. Los imports de Reservas se limitan a fachadas de Usuarios, Proveedores y Catálogo; su repositorio consulta únicamente sus tablas.

- [ ] Ejecutar US positivos y negativos con persistencia real cuando aplica.
- [ ] Comprobar EQ-04, EQ-05, EQ-06, EQ-07, EQ-08 y guardar evidencia de condiciones/resultados.
- [ ] Verificar seguridad, estados web y logs sin secretos.
- [ ] Analizar consistencia y resolver diferencias antes del cierre.

[Spec](../spec.md) · [Tareas](../tasks.md).
