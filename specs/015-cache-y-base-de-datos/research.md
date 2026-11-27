# Investigación — Comportamiento de la base de datos y estrategia de caché

## Punto de partida (2026-11-25)

La prueba de carga del Sprint 1 (spec 004 y docs/06) mostró p95 de 3,8 s con 500 usuarios en la laptop. Cada búsqueda pública hace tres consultas: perfiles de proveedores publicables, cuentas activas de esos proveedores y la página del catálogo, cada una en el pool de su módulo (5 a 10 conexiones; 38 por proceso en total, con espera máxima de 5 s).

## Decisiones (2026-11-25, Santiago Noe)

- **Medir antes de cambiar.** El analizador corre las consultas reales con `EXPLAIN ANALYZE` sobre los datos de carga. Resultado: las búsquedas usan sus índices (texto completo y filtros) y tardan pocos milisegundos; la consulta más cara era «Mis reservas», que materializaba todas las reservas de la cuenta con la subconsulta de cotizaciones. Se reescribió para usar el índice `(cliente_id|propietario_id, creado_en DESC, id DESC)`.
- **Caché en memoria del proceso, no Redis.** Hoy hay un solo proceso de API; Redis agrega un servicio que operar y un salto de red. La caché queda detrás de los repositorios (Decorator), así que cambiar a Redis más adelante es otro decorador, sin tocar el dominio.
- **Solo lecturas públicas.** Nada con sesión, ni el detalle que valida Reservas al solicitar (debe estar al día).
- **TTL corto (30 s) e invalidación por escritura.** Lo que cambia en el propio catálogo se ve al instante; lo que cambia en otro módulo (estado de un proveedor) o en otra réplica, a más tardar en 30 s. Es aceptable para un catálogo público y está documentado.
- **Apagada en pruebas por defecto.** Las pruebas existentes verifican efectos inmediatos entre módulos; la caché tiene sus propias pruebas que la encienden.
- **Errores con `no-store`.** Bruno detectó que `@Header` se aplica antes del controlador y un 400 de la búsqueda salía como cacheable; el filtro global de errores ahora lo fuerza.

## Alternativas descartadas

- **Caché de Next.js (`fetch` con `revalidate`):** dejaría la API igual de expuesta a clientes directos y a la prueba de carga.
- **Vistas materializadas:** el costo no está en el plan de la consulta sino en las idas a la base y los pools.
- **Subir los pools a 20+ conexiones por módulo:** con 6 módulos y varias réplicas superaría `max_connections` (100).
