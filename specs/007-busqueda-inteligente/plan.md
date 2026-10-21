# Plan técnico — Búsqueda inteligente

**Estado:** plan documental; código, migraciones y pruebas aún no ejecutados.

## Technical Context

API NestJS/TypeScript, PostgreSQL/PostGIS y web Next.js/TypeScript; versiones soportadas a fijar y registrar en el arranque del proyecto. Propiedad de datos: configuración de cuota y métricas agregadas; sin copia autoritativa de catálogo. No se introduce Redis, microservicios ni otro módulo sin decisión trazable.

## Constitution Check

- [x] El plan conserva el módulo busqueda, los puertos y la propiedad de datos descritos en docs.
- [x] Las dependencias externas se ubican en infraestructura.
- [x] Las decisiones pendientes y las pruebas de aceptación están registradas.
- [ ] Verificar estas condiciones en el código antes de cerrar la entrega.

## Project Structure

Código previsto en backend/src/modules/busqueda/{dominio,aplicacion,infraestructura,presentacion}; composición en busqueda.module.ts y fachada en index.ts. Pantallas en frontend/src/app y componentes en frontend/src/components/busqueda. Migraciones propias bajo backend/migrations/busqueda; pruebas unitarias junto al dominio e integración bajo backend/test/busqueda. Rutas previstas, todavía inexistentes.

Dominio puro; aplicación consume puertos; infraestructura implementa repositorios/SDK; controladores traducen HTTP a casos de uso. El módulo no importa repositories ajenos ni consulta sus tablas directamente.

## Integración y datos

BuscarEnLenguajeNatural; puerto InterpreteIntencion; consumo de ConsultaCatalogo y ConsultaDisponibilidad en modo lectura.

Los endpoints nuevos se etiquetan como propuestas en [contratos](./contracts/api.md). Se deben sincronizar con el diseño externo/OpenAPI antes de programarlos. Las referencias entre módulos no autorizan lecturas directas.

## Secuencia técnica

1. Resolver D10 y fijar dataset/etiquetas y esquema de intención.
2. Implementar criterios y puertos de lectura sin SDK en dominio.
3. Implementar adapter IA con deadlines/cancelación y validación.
4. Implementar resolución de IDs, prioridad manual y fallback.
5. Conectar buscador/filtros/ambigüedad en web.
6. Medir EQ-02/EQ-10 y costos; no declarar calidad antes de evaluación.

## Verification

- EQ-02: 429/5xx/latencia/JSON inválido con reservas/pagos operativos.
- EQ-10: 50 consultas (30 explícitas,10 ambiguas,10 adversariales), fecha fija y etiquetas humanas.
- Meta >=90% filtros exactos explícitos y >=80% pertinente en primeros5; cero IDs/precios inventados/escrituras.
- Proveedor IA sustituible por doble sin modificar dominio; cuotas y límite 500 caracteres.

Incluir unitarias para reglas y estados, integración PostgreSQL para restricciones/transacciones y recorridos web para cambios visibles. En adaptadores, distinguir doble determinista de servicio externo real. Registrar evidencia en quickstart y validación del diseño.

## Riesgos y bloqueos

- D10: proveedor/modelo, presupuesto mensual, cuota por actor y anonimato de métricas; pendiente antes de activar llamadas facturables.

No activar tareas afectadas mientras falte la decisión. [Tareas](./tasks.md) · [Especificación](./spec.md).
