# 002 — Usuarios y acceso

**Estado:** US1/US2/US3 implementadas localmente; validación y límites en quickstart. Aceptación global de calidad y revisión humana pendientes. **Actualizado:** 2026-10-19.
**Módulo técnico:** usuarios. **Historias:** HU11, HU13.

## Objetivo y alcance

Registrar y autenticar cuentas, gestionar perfil y varios roles, y autorizar las acciones privadas por rol y propiedad.

Interfaz prevista: Registro, login, perfil propio y administración de usuarios con permisos.

Esta especificación detalla responsabilidades del módulo actual. No amplía el MVP a compraventa, ERP, courier, app nativa ni custodia de dinero. Las integraciones se especifican por puertos y capacidades, con validación real cuando aplica.

## User Scenarios & Testing

### US1 — Registrarse e ingresar (P1)

Como visitante, quiero crear una cuenta y acceder a funciones privadas.

**Prueba independiente:** Dado email válido sin registrar, cuando completo el registro, entonces se crea una sola cuenta y no se expone el hash.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US2 — Gestionar cuenta propia (P1)

Como usuario, quiero consultar y actualizar mi perfil.

**Prueba independiente:** Dado una sesión válida, cuando edito mi perfil, entonces solo cambian mis datos permitidos.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

### US3 — Administrar usuarios (P1)

Como administrador, quiero desactivar una cuenta con trazabilidad.

**Prueba independiente:** Dado un administrador autorizado, cuando desactiva una cuenta, entonces el acceso se revoca según política de sesión y se audita la acción.

**Caso negativo:** una identidad sin permiso, datos incompatibles o una transición inválida se rechaza sin mutar la operación.

## Functional Requirements

| ID local | Requisito e invariante | Trazabilidad de alcance |
|---|---|---|
| M002-FR01 | Normalizar email y garantizar unicidad en PostgreSQL; almacenar solo hash seguro de contraseña. | RF12, RF14 |
| M002-FR02 | Una cuenta admite varios roles; el registro público nunca concede administración. | RF12, RF14 |
| M002-FR03 | El actor se obtiene de la sesión; cada caso de uso verifica estado, rol y propiedad. | RF12, RF14 |
| M002-FR04 | Token de corta duración y almacenamiento protegido; decidir transporte y revocación en D01 antes de implementar. | RF12, RF14 |

Cada FR local cubre una regla del módulo; la matriz global distribuye RF/HU entre módulos y escenarios.

## Key Entities

Datos propios: usuarios; roles_usuario. Identidad de actor derivada del servidor. Contratos entre módulos: IdentidadUsuarios: identidad activa, roles y permisos; nunca devuelve hash ni token a otros módulos.

[Modelo específico](./data-model.md) · [Contrato HTTP e interno](./contracts/api.md).

## Edge Cases

- Email duplicado normalizado y dos registros concurrentes: una sola cuenta.
- Matriz cliente/proveedor/admin/anónimo: acciones ajenas rechazadas, incluso con IDs manipulados.
- Contraseña incorrecta, cuenta inactiva y límite de intentos; sin credenciales en logs.

## Success Criteria

- SC01: todos los escenarios positivos definidos se ejecutan con persistencia real cuando existe escritura, sin confundir dobles con integración final.
- SC02: todos los casos de acceso indebido definidos se rechazan sin exposición ni mutación.
- SC03: las invariantes y medidas de EQ-04, EQ-05 se verifican según el entorno del documento EQ; conservar resultado, commit, datos y configuración. Las cifras siguen siendo metas hasta medirlas.
- SC04: web, API y base de datos representan los mismos estados; no hay declaraciones de pago, verificación o disponibilidad ficticias.

## Clarifications

- D01 resuelta el 2026-10-19 en research.md: cookie HttpOnly, JWT 15 min, revocación PostgreSQL y control de origen; sin renovación automática.

Estas decisiones bloquean únicamente las tareas afectadas. El resto del diseño y los contratos ya documentados pueden avanzar.

## Dependencies

Usuarios es base de identidad; no depende de módulos de negocio.

## Artifacts

[Plan](./plan.md) · [Investigación de decisiones](./research.md) · [Tareas](./tasks.md) · [Validación](./quickstart.md) · [Revisión](./checklists/requirements.md).

## Fuentes

- [Historias de usuario](../../docs/01-analisis-de-sistema/02-historias-del-usuario.md).
- [Requisitos funcionales](../../docs/01-analisis-de-sistema/03-requisitos-funcionales.md).
- [Reglas RN01–RN12 y módulos](../../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).
- [Modelo lógico](../../docs/03-diseño-de-software/modelo-de-datos.md).
- [Contratos REST vigentes](../../docs/03-diseño-de-software/diseño-externo/contratos-api.md).
- [Escenarios EQ](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md).
- [ADR](../../docs/01-analisis-de-sistema/07-desision-arquitectonica.md).
- [Constitución](../../.specify/memory/constitution.md).
