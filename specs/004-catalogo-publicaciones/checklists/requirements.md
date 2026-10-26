# Checklist — Catálogo y publicaciones

## Consistencia comprobada por el asistente (2026-10-26)

- [x] D04 resuelta en research y sincronizada con contrato específico y diseño externo.
- [x] HU01/HU02 y RF01/RF02/RF03/RF15 cubiertos por publicación, consulta y moderación sin introducir reservas/pagos.
- [x] Dominio puro sin NestJS/pg; aplicación depende de puertos; infraestructura implementa persistencia propia.
- [x] Catálogo consume fachadas públicas de Usuarios/Proveedores; no importa repositorios ni consulta tablas ajenas. Grafo Usuarios ← Proveedores ← Catálogo, sin ciclo.
- [x] Recursos estables, transacciones, restricciones diferidas y versionActual; auditoría de moderación atómica.
- [x] Público excluye documentos/correo/usuarioId. Cuenta activa, aprobación y visibilidad pública se revisan también al consultar ofertas.
- [x] UI real predeterminada, demo solo explícita, ilustraciones/testimonios identificados y fallos visibles sin datos inventados.
- [x] Pruebas positivas/negativas de dominio, PostgreSQL y E2E ejecutadas; evidencias en quickstart.
- [x] Ensayo local de veinte minutos con 100 proveedores/1000 ofertas, proxy real y código inalterado; informe y límites en cierre.md.
- [ ] Revisión humana independiente del alcance y contratos.
- [ ] Ensayos globales EQ-01/EQ-03 y aceptación completa EQ-06 en las condiciones fuente.

No se declara aceptación total del MVP. D02, conservación operativa/copias, mapas, reservas y pagos conservan sus decisiones y límites de otras entregas.

[Spec](../spec.md) · [Tareas](../tasks.md) · [Evidencia](../quickstart.md).
