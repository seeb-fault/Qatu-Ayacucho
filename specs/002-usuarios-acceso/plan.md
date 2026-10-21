# Plan técnico — Usuarios y acceso

**Estado:** US1/US2/US3 implementadas localmente con NestJS 11, pg y PostgreSQL; resultados en quickstart.md y versiones exactas en backend/package-lock.json. Aceptación global de calidad pendiente.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: usuarios; roles_usuario. No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo usuarios, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [x] Verificar estas condiciones en el código para US1/US2/US3; evidencia en quickstart y checklist.

## Project Structure

Código en backend/src/modules/usuarios/{dominio,aplicacion,infraestructura,presentacion}; composición en usuarios.module.ts y fachada en index.ts. Pantallas en frontend/src/app y componentes en frontend/src/components/usuarios, incluida /admin/usuarios. Migraciones 001/002 bajo backend/migrations/usuarios; pruebas de validación/hash/HTTP/integración en backend/test/usuarios y navegador en frontend/tests/usuarios. Aprovisionamiento sin HTTP en backend/scripts/aprovisionar-admin.ts.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

IdentidadUsuarios: identidad activa, roles y permisos; nunca devuelve hash ni token a otros módulos.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Definir matriz de permisos y decisión D01 de sesión.
2. Implementar entidades Usuario/Roles y migraciones de unicidad.
3. Implementar registro/login y hash mediante adapter.
4. Implementar guardas, IdentidadUsuarios y casos de perfil/admin.
5. Integrar pantallas de acceso/perfil y estados de error.
6. Verificar autorización, concurrencia de registro e invalidez de sesión.

## Verification

- Email duplicado normalizado y dos registros concurrentes: una sola cuenta.
- Matriz cliente/proveedor/admin/anónimo: acciones ajenas rechazadas, incluso con IDs manipulados.
- Contraseña incorrecta, cuenta inactiva y límite de intentos; sin credenciales en logs.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D01 resuelta en research.md el 2026-10-19; no bloquea US1/US2.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
