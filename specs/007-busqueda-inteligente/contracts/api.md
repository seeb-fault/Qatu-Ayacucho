# Contratos — Búsqueda inteligente

**Base:** /api/v1, JSON, ISO 8601; actor del contexto autenticado. Diseño, no API publicada.

## Rutas tomadas del diseño vigente

| Método | Ruta relativa | Acceso | Condición |
|---|---|---|---|
| POST | /busqueda/intencion | Público con cuota | texto y filtros; respuesta validada con modo y resultados reales |

## Extensiones propuestas para cubrir requisitos existentes

- Endpoint administrativo de configuración de cuota solo si se requiere; secretos fuera de API pública.

Estas extensiones aún no están congeladas: completar DTO/estados en OpenAPI y actualizar docs antes de implementar. No se ejecutan operaciones ni llamadas externas desde estas especificaciones.

## Datos de entrada/salida propuestos

Entrada: texto (máximo propuesto 500 caracteres) y filtrosManuales opcionales: tipo, categoriaId, zonaId, inicio, fin, precioMaximoCentimos. El servidor fija fechaReferencia y America/Lima; cuotas antes del adapter.

Salida: modo natural/convencional, criteriosInterpretados, camposQueRequierenPrecision y resultados públicos de catálogo con IDs reales. Respuesta convencional por fallo de IA conserva filtros manuales y aviso; cuota de IA no convierte un fallo controlado en indisponibilidad de búsqueda básica. No retornar cadena SQL, texto de herramientas ejecutables ni secretos del modelo.

## Puerto interno

BuscarEnLenguajeNatural; puerto InterpreteIntencion; consumo de ConsultaCatalogo y ConsultaDisponibilidad en modo lectura.

## Errores y seguridad

400 entrada inválida; 401 no autenticado; 403 no autorizado; 404 inexistente/no visible; 409 conflicto; 429 cuota; 202 pendiente cuando corresponda. Error con code, mensaje y correlationId, sin stack ni secretos. Respuestas públicas excluyen documentos y campos privados.

Paginación base 20 y máximo general 50; para aceptación de EQ-01 utilizar máximo 20. Mutaciones verifican rol/propiedad/estado en aplicación además de la guarda HTTP. Idempotencia es obligatoria en pagos y eventos según RF21/RF22; no se extiende a ciegas a todas las operaciones.

[Contrato fuente](../../../docs/03-diseño-de-software/diseño-externo/contratos-api.md) · [Spec](../spec.md).
