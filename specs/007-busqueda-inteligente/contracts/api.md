# Contrato HTTP — Búsqueda inteligente (007.1, implementado)

| Método | Ruta | Acceso | Cuerpo / respuesta |
|---|---|---|---|
| POST | /busqueda/intencion | Público; Origin y JSON como toda escritura; cuota de IA por IP | `{ texto (1–500), filtros?: { tipo?, categoriaId?, zonaId?, precioMaximoCentimos? }, page? }` → 200 `{ modo, motivo, criterios, fechas, camposQueRequierenPrecision, aviso, resultados }` |

- `modo`: `natural` si la IA interpretó la consulta; `convencional` si se buscaron las palabras tal cual. `motivo` (solo en convencional): `sin_configurar`, `cuota`, `tiempo` (más de 3 s), `error` o `respuesta_invalida`. La IA nunca provoca un error HTTP.
- `criterios`: `{ q, tipo, categoriaId, zonaId, precioMaximoCentimos }` validados contra el catálogo; los `filtros` manuales prevalecen.
- `fechas`: `{ inicio, fin }` mencionadas (America/Lima), siempre en `camposQueRequierenPrecision`: la disponibilidad se confirma al reservar.
- `resultados`: la misma página que `GET /publicaciones` con esos criterios (ofertas, precios e ids reales del catálogo).
- Errores: 400 entrada inválida o campos desconocidos; 403 Origin distinto de APP_ORIGIN.

## Puerto interno

`InterpreteIntencion.interpretar(texto, { fechaReferencia, opciones }, señal)` → JSON no confiable. Adapter: `InterpreteOpenRouter` (`POST {QATU_IA_URL}/chat/completions`, esquema estricto). Búsqueda consume `ConsultaCatalogo.opciones()` y `ConsultaCatalogo.buscar()` (búsqueda pública con caché) e `IdentidadUsuarios.limitar()`.

Esquema completo en [openapi.json](../../../docs/03-diseño-de-software/diseño-externo/openapi.json) (`ResultadoBusquedaInteligente`).
