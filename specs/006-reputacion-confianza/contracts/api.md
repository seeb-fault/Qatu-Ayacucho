# Contratos — Reputación y confianza

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Diseño, no API publicada.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| POST | /reservas/:id/evidencias | Participante | tipo/tamaño/etapa y propiedad |
| POST | /reservas/:id/incidencias | Participante | motivo y revisión humana |
| POST | /reservas/:id/resenas | Cliente de reserva finalizada | una por cliente y reserva |

## Implementado en 006.1 — Reseñas

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | /reservas/:id/resena | Participante (404 a terceros) | `{ resena, puedeResenar, plazo }`; `resena` incluye `oculta` |
| POST | /reservas/:id/resena | Cliente; reserva DEVUELTA o SERVICIO_CERRADO; hasta 14 días tras el cierre | 201 con la reseña. 400 entrada; 403 proveedor; 409 `RESERVA_NO_CERRADA`, `PLAZO_VENCIDO` o `RESENA_DUPLICADA` |
| GET | /proveedores/:id/resenas?page | Público | `{ items, total, promedio, page, limit }`; solo visibles; sin cliente ni reserva |
| GET | /resenas/resumen?proveedores=a,b | Público, hasta 50 ids | `{ [proveedorId]: { promedio, total } }` |
| GET | /admin/resenas?page | Administrador | Todas, con `oculta` y `ultimaModeracion` |
| PATCH | /admin/resenas/:id/moderacion | Administrador que no participó | Cuerpo `{ oculta, motivo }` (10–500); 403 si participó |

Entrada de reseña: `{ puntuacion: 1–5 entero, texto?: hasta 600 }`; campos extra se rechazan. `promedio` se redondea a un decimal y es `null` sin reseñas visibles. La ruta es singular porque hay una reseña por reserva.

## Extensiones propuestas para cubrir requisitos existentes

- GET /evidencias/:id/archivo con autorización por participante/admin.
- POST/PATCH /reservas/:id/garantia para acuerdo y registro documental.
- Resolución de incidencias auditada.

Estas extensiones aún no están congeladas: completar DTO/estados en OpenAPI y actualizar docs antes de implementar. No se ejecutan operaciones ni llamadas externas desde estas especificaciones.

## Datos de entrada/salida propuestos

Reseñar: puntuacion entera 1–5 y texto acotado; reservaId por ruta y autor desde sesión. Respuesta: id y estado de moderación. Evidencia: archivo, etapa y referencia a operación; validar tipo real, tamaño, participante y fase antes de guardar. Descarga privada por id con nueva autorización; no confiar en URL conocida.

Garantía: montoCentimos/condiciones/version del acuerdo documental; nunca instrucción de transferencia. Incidencia: motivo y referencias autorizadas a evidencias. Resolución administrativa registra resultado, responsable y fecha, sin afirmar devolución bancaria por cambiar estado documental.

## Puerto interno

RegistroConfianza y lectura de reputación; ConsultaReservas para participantes/estado; almacén privado por adapter.

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
