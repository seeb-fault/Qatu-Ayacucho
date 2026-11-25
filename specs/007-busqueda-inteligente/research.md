# Decisiones e investigación — Búsqueda inteligente

## Evidencia local

ADR-002, ADR-003, ADR-009 gobiernan esta entrega. HU01, HU15, HU16 y RF01, RF16, RF17 definen el alcance. No se infiere arquitectura de terceros a partir de sus pantallas.

## Decisiones conservadas

- Salida del modelo es no confiable; validar esquema, límites e IDs contra catálogo y zonas reales.
- Filtros manuales tienen prioridad; fechas relativas con reloj inyectado/contexto America/Lima; ambigüedad se muestra, no se inventa.
- Modelo interpreta, backend consulta precio/disponibilidad. Sin SQL generado ni acciones de escritura.
- Interpretación máximo 3 s y solicitud total 5 s como metas; cortar llamadas al vencer deadline.

## D10 — Proveedor y límites (resuelta 2026-11-25, Santiago Noe)

- **OpenRouter** como pasarela: API compatible con OpenAI, una sola llave para muchos modelos y cambio de modelo sin tocar código (`QATU_IA_MODELO`). Se pide `require_parameters` (solo proveedores que respetan el esquema JSON) y `data_collection: deny` (sin conservar consultas para entrenamiento).
- **Modelo por defecto `anthropic/claude-haiku-5.5`:** rápido, con salida estructurada y barato (US$ 0,10 por millón de tokens de entrada y 0,50 de salida; unas 9 000 búsquedas por dólar con ~700 tokens cada una).
- **Salida estructurada con esquema estricto** y listas cerradas (`enum`) de categorías y distritos tomadas del catálogo real; aun así la respuesta se valida en el dominio y lo inválido se descarta y se pide precisión.
- **Cuotas:** 30 búsquedas con IA por IP y 600 en total cada 15 minutos (tabla `limites_acceso` existente). Al superarlas, modo convencional, no error.
- **Presupuesto:** se controla con el límite de crédito de la llave en OpenRouter; un 402 (sin crédito) también lleva al modo convencional.
- **Privacidad:** solo se envía el texto de la consulta, la fecha y las listas de categorías y distritos; nunca la cuenta, la sesión ni datos de reservas. No se registra el texto. La política de privacidad lo informa y pide no escribir datos personales.
- **Sin migraciones:** las métricas agregadas (EQ-10) quedan para la etapa de evaluación.

## Alternativas consideradas

- SDK directo de un proveedor: ata el código a un modelo. OpenRouter permite comparar modelos en EQ-10 cambiando una variable.
- Interpretación por reglas sin IA: es el modo convencional de respaldo, no reemplaza la comprensión de frases.

## Alternativas y límites

Conservar monolito modular reduce operación para un VPS/equipo pequeño; extraer servicios o añadir caché requiere medición. Los contratos por adapter facilitan pruebas y sustitución sin prometer aislamiento de CPU/memoria dentro del mismo proceso.

## Resultado

Plan elaborado contra documentación existente; decisiones pendientes aún sin resolver. Documentar decisión, fecha, responsable y cambios de contrato antes de ejecutar tareas bloqueadas.
