# Patrones de diseño de Qatu

## Objetivo

Definir patrones para necesidades concretas. Son propuestas de implementación, no clases ejecutables existentes.

| Patrón | Ubicación | Problema | Elementos previstos | Estado |
|---|---|---|---|---|
| Adapter | Pagos de Reservas | Traducir API y estados de Culqi | ProcesadorPagos, CulqiPagoAdapter | MVP obligatorio |
| Adapter | Búsqueda inteligente | Sustituir proveedor de IA | InterpreteIntencion, ModeloLenguajeAdapter | MVP obligatorio |
| Adapter | Mapas, mensajería y archivos | Aislar APIs, errores y permisos | ServicioMapas, Notificador, AlmacenEvidencias | MVP |
| Repository | Persistencia | Separar SQL y negocio | RepositorioReservas, PostgresReservasRepository | MVP |
| Unit of Work | Reservas | Guardar reserva, bloqueo y evento atómicamente | UnidadTrabajoReservas | MVP |
| Facade | API pública de módulos | Evitar acceso a detalles privados | ConsultaCatalogo, ConsultaDisponibilidad | MVP |
| Strategy | Búsqueda | Elegir interpretación natural o filtros convencionales | BuscarConIntencion, BuscarPorFiltros | MVP |
| State, mediante enum y métodos | Reserva, pago y garantía | Impedir transiciones inválidas | Reserva.aceptar/confirmar/iniciar/finalizar | MVP; sin clase por estado inicialmente |
| Transactional Outbox | Eventos de Reservas | Evitar perder avisos tras commit | outbox_eventos, PublicadorOutbox | MVP |
| Idempotent Receiver / Inbox | Confirmaciones de pago | Evitar efectos repetidos | eventos_pasarela con clave única | MVP |
| Decorator | Consultas públicas | Añadir caché sin modificar reglas | CatalogoCacheDecorator, Redis | Opcional tras medir |

## Pago fiable

1. Persistir intento y clave de operación antes de solicitar un cobro.
2. Si hay timeout, conservar resultado desconocido y conciliar; no cobrar otra vez a ciegas.
3. Verificar notificación según mecanismo oficial del proveedor. Si no existe firma verificable, consultar el recurso mediante API autenticada antes de aceptar el evento.
4. En una transacción deduplicar evento, comprobar monto/moneda/referencia, actualizar estados y registrar outbox.
5. Publicar después del commit; consumidores deduplican y guardan entregas/reintentos.

PostgreSQL no puede revertir un cobro externo. La idempotencia local tampoco implica deduplicación en la pasarela: verificar esa capacidad. No mantener transacción SQL abierta mientras se llama a terceros.

## Respaldo de IA

Validar esquema cerrado de filtros. Si falla interpretación, ofrecer modo convencional y filtros manuales; no inventar restricciones. Deadline total de 5 segundos, interpretación máximo 3 segundos, sin reintentos ilimitados. Reservas y pagos no llaman a IA.

## Caché y eventos

Cachear publicaciones públicas solo cuando EQ-01 justifique el costo. Invalidar al editar/desactivar y separar claves por filtros/paginación. La aceptación siempre comprueba disponibilidad en Reservas/PostgreSQL. Outbox puede procesarse dentro del backend; un futuro worker separado debe aparecer en C4 nivel 2 y despliegue. No usar Observer en memoria como única garantía de entrega.

[ADR](../../01-analisis-de-sistema/07-desision-arquitectonica.md) · [Escenarios](../../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [C4 componentes](../../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md).
