# Plan técnico — Proveedores y verificación

**Estado:** implementación local de perfiles, revisión documental y consulta pública con NestJS 11, pg/PostgreSQL y Next.js 16.4.1; resultados en quickstart.md. D02/mapas/Catálogo y aceptación global pendientes.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: proveedores; verificaciones. No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo proveedores, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código en backend/src/modules/proveedores/{dominio,aplicacion,infraestructura,presentacion}; composición en proveedores.module.ts y fachada en index.ts. Pantallas /proveedor, /proveedores/:id y /admin/proveedores con componentes en frontend/src/components/proveedores. Migraciones 001-perfiles/002-verificaciones; pruebas en backend/test/proveedores y frontend/tests/proveedores. Documentos por puerto con adapter cifrado PostgreSQL; limpieza inicial/horaria y CLI.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

ConsultaProveedores: perfil público, zona y estado; documentos y observaciones internas permanecen privados.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Precisar estados de verificación y política D02/D03.
2. Crear perfil/verificación y unicidad por usuario.
3. Implementar revisión administrativa y auditoría.
4. Implementar fachada pública y adapter de mapas con zona manual.
5. Integrar panel proveedor y cola de verificación.
6. Probar documentos privados y rechazo de autoaprobación.

## Verification

- Perfil duplicado y usuario inexistente/inactivo.
- Acceso a documento propio, ajeno y administrativo; URL no pública.
- Fallo de mapas conserva selección manual; estado de verificación no modificable por cliente.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D02: tratamiento de publicaciones y reservas existentes al desactivar un proveedor; pendiente antes de desactivación operativa.
- D03 documental resuelta en research.md por elección del usuario; mapas externos pendientes. La selección manual no depende de un servicio de mapas.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
