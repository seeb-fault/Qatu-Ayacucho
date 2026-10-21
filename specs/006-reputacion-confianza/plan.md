# Plan técnico — Reputación y confianza

**Estado:** plan documental; código, migraciones y pruebas aún no ejecutados.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: resenas; garantias_documentadas; evidencias; incidencias. No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo resenas, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código previsto en backend/src/modules/resenas/{dominio,aplicacion,infraestructura,presentacion}; composición en resenas.module.ts y fachada en index.ts. Pantallas en frontend/src/app y componentes en frontend/src/components/resenas. Migraciones propias bajo backend/migrations/resenas; pruebas unitarias junto al dominio e integración bajo backend/test/resenas. Rutas previstas, todavía inexistentes.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

RegistroConfianza y lectura de reputación; ConsultaReservas para participantes/estado; almacén privado por adapter.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Resolver D09 y permisos por etapa/participante.
2. Crear entidades/constraints de reseña, garantía, evidencia e incidencia.
3. Implementar adapter de archivos privados y descarga autorizada.
4. Implementar elegibilidad de reseña por ConsultaReservas y moderación.
5. Implementar registro documental y revisión humana de incidencias.
6. Integrar interfaz de evidencias/reseñas/garantía y verificar privacidad.

## Verification

- Reseña ajena/anticipada/duplicada y puntuación inválida rechazadas; duplicado concurrente único.
- Descargas de evidencia ajena y archivos inválidos rechazados; hashes y referencias verificables.
- Moderación conserva auditoría y recalcula agregados sin reseñas ocultas.
- Restaurar archivos junto con metadata conforme a EQ-09.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D09: límites de archivo, retención/borrado, política de garantía y responsables de revisión antes de habilitar cargas/garantías.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
