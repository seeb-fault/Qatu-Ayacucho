# Checklist — Proveedores y verificación

## Revisión documental

- [ ] Revisión humana de alcance HU12, requisitos RF13 y reglas locales.
- [x] Resolver decisiones de las tareas elegidas: D03 documental elegida por el usuario; D02 y mapas no se implementan sin resolver.
- [x] Completar contratos textuales y matriz de acceso; sincronizar diseño externo/modelo físico. OpenAPI estructurado sigue pendiente.
- [x] Verificar dependencia por fachadas y propiedad de datos: Proveedores → IdentidadUsuarios; sin lectura de tablas/repositories de otro módulo.

## Aceptación funcional (pendiente)

- [x] Ejecutar perfiles/consulta/revisión positivos y negativos con PostgreSQL y adjuntos sintéticos; mapa externo e integración de Catálogo no se presentan como ejecutados.
- [ ] Comprobar EQ-04, EQ-05, EQ-06 y guardar evidencia de condiciones/resultados.
- [x] Verificar propiedad, roles, cifrado, descargas privadas, concurrencia, rollback y estados web locales. Claves por entorno; sin documentos personales en el repositorio.
- [x] Analizar imports, contratos y migraciones del incremento local; evidencia y limitaciones en quickstart.

[Spec](../spec.md) · [Tareas](../tasks.md).

## Pendientes de aceptación

- [ ] Resolver D02 y probar efectos sobre publicaciones/reservas al integrar 004/005.
- [ ] Seleccionar/integrar mapas por adapter y ensayar su fallo con respaldo manual.
- [ ] Validar en 008 operación de limpieza, copias/restauración, custodia/rotación de claves, análisis adicional de archivos, HTTPS y capacidad con datos representativos.
- [ ] OpenAPI estructurado y aceptación global EQ-04/EQ-05/EQ-06.
