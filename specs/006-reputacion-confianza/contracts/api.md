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

## Implementado en 006.2 — Evidencias

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | /reservas/:id/evidencias | Participante (404 a terceros) | `{ items, etapasAbiertas, maximoPorEtapa, diasDeRetencion }`; cada item: id, etapa, autor (cliente/proveedor), tipo, bytes, sha256, creadaEn, disponible |
| POST | /reservas/:id/evidencias | Participante; multipart con `etapa` y `fotos` (1–4) | 201 `{ items }`. 400 formato o etapa; 404 tercero; 409 `ETAPA_CERRADA` o `CUPO_EVIDENCIAS`; 503 sin `DOCUMENTOS_KEY` |
| GET | /evidencias/:id/archivo | Participante o administrador | Descarga `attachment` con `CSP sandbox`; 404 a terceros; 410 si se borró por retención |

Etapas: **entrega** con la herramienta en manos del cliente (ENTREGA_POR_CONFIRMAR, EN_CURSO); **devolución** desde el aviso (DEVOLUCION_PENDIENTE) y hasta 48 h después de DEVUELTA; **trabajo** durante el servicio y hasta 48 h después de SERVICIO_CERRADO. Solo JPEG o PNG reconocidos por firma, de hasta 5 MiB, 4 por etapa. El guard comprueba sesión y participación antes de leer los archivos; `app.ts` solo admite multipart en esta ruta y en la verificación de proveedores.

## Implementado en 006.3 — Incidencias y garantía documental

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | /reservas/:id/incidencias | Participante | `{ items, puedeReclamar }` |
| POST | /reservas/:id/incidencias | Participante, desde la entrega hasta 48 h tras el cierre | `{ tipo, descripcion }`; 409 `RECLAMO_FUERA_DE_PLAZO` o `INCIDENCIA_ABIERTA` |
| GET | /admin/incidencias?estado&page | Administrador | Abiertas o resueltas |
| GET | /admin/incidencias/:id/evidencias | Administrador | Metadata de las fotos de la reserva |
| PATCH | /admin/incidencias/:id/resolucion | Administrador que no participó | `{ resultado, motivo }`; 409 si ya está resuelta |
| GET | /reservas/:id/garantia | Participante | `{ aplica, garantia }`; solo herramientas |
| PUT | /reservas/:id/garantia | Proveedor antes de entregar | `{ condiciones }` (20–1000); sin monto; 409 tras la conformidad |
| POST | /reservas/:id/garantia/conformidad | Cliente al recibir | `{ version }` vigente; 409 si cambió |

## Extensiones propuestas para cubrir requisitos existentes

- Avisos de apertura y resolución de incidencias a los participantes.

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
