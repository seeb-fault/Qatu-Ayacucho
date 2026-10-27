# Checklist — Reservas, contratación y pagos

## Revisión documental

- [ ] Revisión humana de alcance HU03/HU04/HU05/HU06/HU07/HU08/HU09/HU19/HU20, requisitos RF04/RF05/RF06/RF07/RF08/RF09/RF10/RF18/RF21/RF22/RF23 y reglas locales.
- [ ] Resolver decisiones que bloqueen las tareas elegidas.
- [ ] Completar DTO y contratos propuestos sin cambiar silenciosamente docs.
- [ ] Verificar dependencia por fachadas y propiedad de datos.

## Aceptación funcional (pendiente)

El incremento 005.1 tiene alcance propio en contracts/api.md y tasks.md (T037–T040). Su validación no cierra US1–US4 ni las decisiones D05–D08/D12. No hay pagos, reservas confirmadas ni envíos externos simulados. Los imports de Reservas se limitan a fachadas de Usuarios, Proveedores y Catálogo; su repositorio consulta únicamente sus tablas.

- [ ] Ejecutar US positivos y negativos con persistencia real cuando aplica.
- [ ] Comprobar EQ-04, EQ-05, EQ-06, EQ-07, EQ-08 y guardar evidencia de condiciones/resultados.
- [ ] Verificar seguridad, estados web y logs sin secretos.
- [ ] Analizar consistencia y resolver diferencias antes del cierre.

[Spec](../spec.md) · [Tareas](../tasks.md).
