# Investigación — Operación

Decisión: un VPS Compose conforme ADR-010. Motivo: presupuesto y tamaño del equipo. Alternativa descartada inicialmente: cluster Kubernetes, por carga operativa.

Decisión: copias externas de DB y archivos, conforme ADR-012. Motivo: un volumen en el mismo host no protege su pérdida. Retención propuesta: 7 diarias/4 semanales, confirmar costo/política antes de operar.

Pendiente: host/dominio/presupuesto, repositorio de copias, cifrado, custodia de claves y alertas. Registrar elección con precio/fecha y ensayo, sin declarar disponibilidad mensual por una prueba breve.
