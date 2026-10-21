# Checklist — Usuarios y acceso

## Revisión documental

- [ ] Revisión humana de alcance HU11/HU13, requisitos RF12/RF14 y reglas locales.
- [x] Resolver decisiones que bloqueen las tareas elegidas (D01 y políticas US3 en research).
- [x] Completar DTO y contratos textuales; sincronizar contrato fuente, ADR y modelo físico. OpenAPI estructurado sigue pendiente.
- [x] Verificar dependencia por fachadas y propiedad de datos; sin acceso a tablas de otros módulos.

## Aceptación funcional (pendiente)

- [x] Ejecutar US1/US2/US3 positivos y negativos con PostgreSQL real en bases de prueba.
- [ ] Comprobar EQ-04, EQ-05 y guardar evidencia de condiciones/resultados.
- [x] Verificar seguridad y estados web de Usuarios; CLI recibe contraseña por entorno efímero y no la imprime, salidas HTTP sin hash/JWT.
- [x] Analizar consistencia de código/imports/contratos para este módulo; no equivale a aceptación global del MVP.

[Spec](../spec.md) · [Tareas](../tasks.md).

## Incremento verificado 2026-10-19

- [x] US1/US2 con API NestJS y PostgreSQL real: 10 pruebas de backend, sin integración omitida.
- [x] Recorrido real en Chrome: 2 pruebas de usuarios y regresión de 13 pruebas de descubrimiento.
- [x] D01 sincronizada en research, ADR-007 y contrato fuente; solo identidad pública exportada entre módulos.
- [x] US3: backend final con 19 pruebas totales, matriz anónimo/cliente/proveedor/admin, auditoría transaccional, concurrencia y rollback. Chrome con 4 pruebas de usuarios, incluidos flujo administrativo y rechazo de acceso directo.
- [ ] OpenAPI estructurado, aceptación global EQ-04/EQ-05 y revisión humana de alcance.
