<!-- Sync impact: initial Qatu constitution 1.0.0, 2026-10-15. No prior ratified version. Shared upstream templates retained unchanged; domain rules live here. -->
# Constitución de Qatu

## Core Principles

### I. Alcance y trazabilidad

El MVP cubre alquiler de herramientas y contratación de oficios en Ayacucho. Todo cambio se vincula a HU/RF, restricciones, ADR y escenarios EQ vigentes en docs. Las especificaciones de implementación viven en specs. Una propuesta de interfaz o un doble de prueba no prueba integración real.

### II. Seis módulos y dependencias hacia el dominio

La API es un monolito modular NestJS con usuarios, proveedores, catalogo, reservas, resenas y busqueda. Pagos y calendario pertenecen a Reservas; administración usa permisos; mapas, mensajes y archivos son soporte. Cada módulo conserva dominio, aplicación, infraestructura y presentación. El dominio no importa NestJS, ORM ni SDK. No se consultan tablas/repositories ajenos; se consumen fachadas/puertos con DTO. El grafo documentado de dependencias no admite ciclos.

### III. Seguridad por identidad, rol y propiedad

El servidor determina el actor y valida estado, rol y propiedad en cada acción. Cuentas admiten varios roles; no se concede administración por registro público. Evidencias y documentos son privados. No se guardan PAN/CVV, secretos ni tokens de pago en repositorio/logs. La política de sesión se documenta antes de implementarse, con CSRF si corresponde.

### IV. Reserva y dinero consistentes

Pendientes no bloquean. Aceptación guarda reserva, bloqueo por recurso/rango y outbox en transacción PostgreSQL; una exclusión impide solapamiento. Los intervalos son [inicio,fin); la política de duración comercial se especifica por separado. El backend calcula céntimos PEN y conserva snapshot. Reserva, pago y garantía tienen estados diferentes. Garantía es documental, sin custodia ni comisión propia. Cotización variable se acepta antes de cobrar.

### V. Pagos verificables e integraciones resistentes

La pasarela es obligatoria, Culqi candidata y Yape sujeto a habilitación. Checkout tokeniza con el proveedor. Persistir intento antes de I/O; deduplicar operación/evento; verificar referencia/monto/moneda/estado; timeout desconocido se concilia antes de recobrar. Pago tardío no reasigna fechas. Outbox/reintentos no duplican efectos. Sandbox real es condición de aceptación de pagos; un simulador no lo sustituye.

### VI. IA limitada a búsqueda

Interpretar intención produce datos no confiables que se validan contra esquema e IDs reales. Filtros editables y manuales prevalecen; no generar SQL ni ejecutar reservas/pagos. Deadline propuesto: 3 s interpretación y 5 s total. Cuota y fallback convencional obligatorios. Calidad se evalúa con EQ-10 y costos registrados; no se declara exactitud por una demostración.

### VII. Validación proporcional y evidencia

Verificar invariantes con pruebas útiles: autorización EQ-04, concurrencia PostgreSQL EQ-07 y pagos EQ-08 son obligatorios. Las medidas de rendimiento/usabilidad/recuperación son metas pendientes hasta ejecutarse en condiciones registradas. Mantener pruebas de contrato, dominio e integración según el cambio; no exigir TDD ceremonial ni pruebas que solo copien implementación. Toda entrega registra commit, entorno, datos, comandos y resultado.

## Technology and Operational Constraints

Next.js/React/TypeScript, NestJS/TypeScript y PostgreSQL/PostGIS. API REST /api/v1. Instantes UTC, presentación America/Lima, soles con unidad explícita. Versiones soportadas se fijan al implementar. Docker Compose y proxy HTTPS en un VPS con datos persistentes y copias externas; RPO 24 h/RTO 4 h son objetivos a ensayar. Redis y pgvector solo si evaluación lo justifica. Mapas y mensajería externos previstos por RC05/RC06, con zona manual y reintento de avisos. Aplicación móvil desde navegador; sin prometer alta disponibilidad del único host.

## Development Workflow

Constitución → especificación → aclaraciones necesarias → plan → tareas por historia → análisis de consistencia → implementación → convergencia y aceptación. Los artefactos preparados con decisiones abiertas son borradores para las operaciones afectadas; no representan un plan aprobado para ejecutarlas. Resolver políticas en research y sincronizar docs/specs antes del código correspondiente. Los prompts y scripts de Spec Kit se mantienen separados de la aplicación desplegada.

## Governance

La constitución recoge el diseño Qatu existente; no sustituye instrucciones del usuario. Ante contradicción entre docs/specs/código, registrar el hallazgo, resolverlo y actualizar trazabilidad. Cambios de alcance, límites de módulos o invariantes requieren decisión documentada y versión de esta constitución; no se introducen silenciosamente. Ninguna casilla de implementación se marca por redactar documentos. Commits y publicación quedan bajo control del usuario.

**Version**: 1.0.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-10-15
