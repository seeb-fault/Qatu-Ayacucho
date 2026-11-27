# Modelo de datos — Documentación y pruebas de contrato de la API

Sin cambios en la base de datos ni migraciones.

## Esquemas del contrato (`components.schemas`)

| Grupo | Esquemas |
|---|---|
| Común | `Error` (`code`, `mensaje`, `correlationId`) |
| Usuarios | `Usuario`, `Sesion`, `PaginaUsuarios`, `EventoAuditoriaUsuario`, `PaginaAuditoriaUsuario` |
| Proveedores | `Zona`, `ProveedorPublico`, `ProveedorPropio`, `PoliticaDocumental`, `SolicitudVerificacion`, `PaginaSolicitudesVerificacion` |
| Catálogo | `Recurso`, `ProveedorEnCatalogo`, `UbicacionPublica`, `Publicacion`, `PublicacionPropia`, `PaginaPublicaciones`, `PaginaPublicacionesPropias`, `OpcionesCatalogo`, `UbicacionGuardada`, `UbicacionPropia`, `EventoModeracion` |
| Reservas | `Cotizacion`, `Reserva`, `PaginaReservas`, `Disponibilidad`, `Contacto`, `ItemLista`, `Aviso` |
| Pagos | `IntentoPago`, `ConfiguracionPagos` |
| Reputación | `Resena`, `ResenaModerable`, `Reputacion`, `Evidencia`, `Incidencia`, `Garantia`, `Titular`, `HojaReclamacion` |

Seguridad: `sesion` (apiKey en la cookie `qatu_sesion`).

## Variables de entorno

| Variable | Valores | Efecto |
|---|---|---|
| `QATU_DOCS` | vacío, `1`, `0` | Vacío: página encendida salvo con `NODE_ENV=production`. `1`: siempre. `0`: nunca |
