# 07 - Decisiones arquitectónicas de Qatu

## Estado

Diseño propuesto para el MVP académico de noviembre de 2026; implementación y medidas pendientes. Mantiene IDs ADR-001 a ADR-008 y añade las decisiones requeridas por IA, VPS, pagos fiables y confianza.

## Registro

| ID | Decisión | Drivers |
|---|---|---|
| ADR-001 | Monolito modular de seis módulos | DA01, DA07 |
| ADR-002 | Clean Architecture por módulo | DA07 |
| ADR-003 | Búsqueda e índices antes de caché opcional | DA02 |
| ADR-004 | Pasarela de pago obligatoria mediante adapter | DA04, DA12 |
| ADR-005 | Integraciones tolerantes a fallos | DA06 |
| ADR-006 | Concurrencia en PostgreSQL | DA08 |
| ADR-007 | Autenticación, roles y propiedad | DA03 |
| ADR-008 | Web móvil con paginación | DA09, DA05 |
| ADR-009 | Búsqueda natural aislada por puertos de lectura | DA10 |
| ADR-010 | Despliegue único en VPS y recuperación | DA11, DA01 |
| ADR-011 | Intentos persistidos, inbox/outbox y conciliación | DA12, DA04 |
| ADR-012 | Evidencias privadas y garantía documental | DA13, DA03, DA11 |

## ADR-001 - Monolito modular de seis módulos

- **Contexto:** Equipo pequeño, fecha de entrega y VPS económico.
- **Decisión:** Usuarios, Proveedores, Catálogo, Reservas, Reputación/confianza (resenas) y Búsqueda inteligente (busqueda) en una API NestJS; pagos dentro de Reservas.
- **Alternativa descartada:** Microservicios desde el inicio.
- **Consecuencias:** Menor operación; módulos comparten proceso y recursos. Extracción futura requiere trabajo y evidencia.

## ADR-002 - Clean Architecture por módulo

- **Contexto:** Reglas deben probarse sin frameworks.
- **Decisión:** Dominio, aplicación, infraestructura, presentación; composition root NestJS y contratos públicos.
- **Alternativa descartada:** Lógica en controladores o entidades ORM.
- **Consecuencias:** Más estructura; imports hacia puertos/dominio. Frontend presenta datos y backend decide reglas.

## ADR-003 - Búsqueda e índices antes de caché opcional

- **Contexto:** Presupuesto inicial y consultas frecuentes.
- **Decisión:** PostgreSQL/indexación/paginación inicial; Redis se activa si EQ-01 demuestra necesidad. Disponibilidad final siempre en BD.
- **Alternativa descartada:** Redis obligatorio sin medir.
- **Consecuencias:** Menos servicios al inicio; invalidación necesaria si se activa.

## ADR-004 - Pasarela de pago obligatoria mediante adapter

- **Contexto:** El usuario exige pago integrado.
- **Decisión:** ProcesadorPagos y CulqiPagoAdapter como candidato; Yape mediante integración habilitada. Tokenización en proveedor; backend calcula/cobra/verifica.
- **Alternativa descartada:** Comprobante manual como sustituto de pasarela.
- **Consecuencias:** Sandbox real obligatorio; credenciales y capacidades por confirmar. No guardar tarjetas ni custodiar garantías.

## ADR-005 - Integraciones tolerantes a fallos

- **Contexto:** Mensajería/mapas pueden fallar.
- **Decisión:** Notificador y ServicioMapas por adapters; zona manual cuando mapas no responden; avisos por outbox y reintentos.
- **Alternativa descartada:** Llamada a WhatsApp dentro de transacción de reserva.
- **Consecuencias:** Eventos durables y seguimiento de entregas; fallos no revierten reserva confirmada.

## ADR-006 - Concurrencia en PostgreSQL

- **Contexto:** Aceptaciones simultáneas para un recurso.
- **Decisión:** Transacción reserva/bloqueo/outbox y exclusión recursoId/rango [inicio,fin) sobre bloqueos activos. Pendiente no bloquea; aceptación vence provisionalmente a 15 min.
- **Alternativa descartada:** Comprobar solo en aplicación o caché.
- **Consecuencias:** 409 para conflicto. Vencimiento y confirmación usan bloqueo/versión; liberar bloqueo explícitamente. Capacidad por unidad física/agenda.

## ADR-007 - Autenticación, roles y propiedad

- **Contexto:** Datos privados y cuentas con varios roles.
- **Decisión:** JWT corto, HTTPS, hash seguro, roles múltiples y autorización por propietario; auditar cambios. D01 concretada el 2026-10-19: cookie HttpOnly/Strict/Secure en producción, JWT 15 min, sesión revocable en PostgreSQL y validación de origen en escrituras; sin renovación automática. US3 registra actor/cuenta/estados/motivo/fecha en transacción junto a revocación; cuentas admin protegidas y aprovisionamiento por CLI sobre cuenta nueva. [Detalle técnico y límites](../../specs/002-usuarios-acceso/research.md).
- **Alternativa descartada:** Confiar solo en rol recibido del frontend.
- **Consecuencias:** No exposición de evidencias o reservas ajenas; pruebas EQ-04. Cookie requiere protección CSRF.

## ADR-008 - Web móvil con paginación

- **Contexto:** Celulares y red variable.
- **Decisión:** Next.js con renderizado e imágenes optimizadas; REST /api/v1; filtros editables y costos visibles.
- **Alternativa descartada:** App nativa para la entrega.
- **Consecuencias:** Frontend separado, reglas autoritativas en API. Evaluación EQ-06.

## ADR-009 - Búsqueda natural aislada por puertos de lectura

- **Contexto:** IA útil sin bloquear operaciones principales.
- **Decisión:** InterpreteIntencion devuelve datos no confiables; validar esquema/IDs; consultar APIs públicas Catálogo/Disponibilidad. Deadline total 5 s, interpretación 3 s. Cuotas y respaldo convencional.
- **Alternativa descartada:** IA transversal invocada por todas las reservas; SQL libre generado.
- **Consecuencias:** Reservas/pagos no dependen de IA; se comparte proceso. Embeddings/pgvector posteriores si evaluación lo justifica.

## ADR-010 - Despliegue único en VPS y recuperación

- **Contexto:** Costo y plazo.
- **Decisión:** Docker Compose, proxy HTTPS, red privada, volúmenes, health/logs, backup externo diario y ensayo de restore.
- **Alternativa descartada:** Cluster/Kubernetes inicial.
- **Consecuencias:** Punto único de fallo. RPO 24 h/RTO 4 h son metas por validar, no cumplimiento demostrado.

## ADR-011 - Intentos persistidos, inbox/outbox y conciliación

- **Contexto:** Pago externo no comparte transacción SQL.
- **Decisión:** Persistir intento antes de I/O; deduplicación por operación/evento; verificar estado/monto/moneda/referencia. Confirmación e inbox/outbox atómicos; timeout desconocido y consulta externa.
- **Alternativa descartada:** Cobrar y después crear registro; reintentar cobro a ciegas.
- **Consecuencias:** Entrega al menos una vez con consumidores idempotentes. Pago tardío no reactiva reserva vencida; registrar ajuste/reembolso.

## ADR-012 - Evidencias privadas y garantía documental

- **Contexto:** Entrega/devolución e incidencias.
- **Decisión:** AlmacenEvidencias por adapter, metadata/hashes en BD, control por participante, archivos persistentes y backup; garantías sin comisión ni custodia propia.
- **Alternativa descartada:** Archivos públicos o decisiones automáticas de daño mediante IA.
- **Consecuencias:** Revisión humana; no afirmar que estados documentales acreditan movimiento bancario.

## Verificación y fuentes

[Escenarios EQ-01 a EQ-10](./08-escenarios-atributos-calidad.md) y [plan de validación](../03-diseño-de-software/validacion-del-diseno.md).

Fuentes oficiales verificadas el 13/10/2026: [Culqi cargos/Yape](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/cargos/), [API Culqi](https://apidocs.culqi.com/), [PostgreSQL rangos](https://www.postgresql.org/docs/17/rangetypes.html), [Docker Compose en producción](https://docs.docker.com/compose/how-tos/production/).
