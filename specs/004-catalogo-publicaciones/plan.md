# Plan técnico — Catálogo y publicaciones

**Estado:** plan documental; código, migraciones y pruebas aún no ejecutados.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: publicaciones; categorias; recursos; tarifas. No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo catalogo, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código previsto en backend/src/modules/catalogo/{dominio,aplicacion,infraestructura,presentacion}; composición en catalogo.module.ts y fachada en index.ts. Pantallas en frontend/src/app y componentes en frontend/src/components/catalogo. Migraciones propias bajo backend/migrations/catalogo; pruebas unitarias junto al dominio e integración bajo backend/test/catalogo. Rutas previstas, todavía inexistentes.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

ConsultaCatalogo: ofertas activas, recurso estable y datos de tarifa para snapshot. No autoriza reservas ni escribe bloqueos.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Definir D04 y validar campos públicos/privados.
2. Crear publicación/categoría/recurso/tarifa con índices.
3. Implementar alta/edición/desactivación y moderación.
4. Implementar ConsultaCatalogo y lectura REST paginada.
5. Conectar la interfaz de entrega 001 y editor de publicaciones.
6. Verificar permisos, filtros persistidos y carga EQ-01/EQ-03.

## Verification

- Proveedor no verificado y edición ajena rechazados.
- Datos persistidos: filtro tipo/categoría/zona/precio, límite 20 y orden estable sin duplicados.
- Desactivar entre listado/detalle, recurso multiu­nidad y precio inválido.
- EQ-01 y EQ-03 con dataset/condiciones del documento; no reportar cumplimiento antes de medir.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D04: búsqueda textual y contrato de filtros/orden/paginación; propuesta en contratos de esta entrega, revisar antes de congelar API.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
