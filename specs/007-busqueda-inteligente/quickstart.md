# Validación — Búsqueda inteligente

## Activar la IA en desarrollo

1. Crea una llave en https://openrouter.ai/keys con un límite de crédito bajo (por ejemplo US$ 2).
2. En `backend/.env`: `OPENROUTER_API_KEY=<tu llave>` (opcional: `QATU_IA_MODELO=`). Reinicia el backend.
3. En `http://localhost:3000`, escribe en «Describe lo que necesitas»: «un taladro en el centro por menos de 40 soles para el sábado». Debe llevarte a /buscar con Perforación, distrito Ayacucho y hasta S/ 40, y la nota con la fecha a confirmar.
4. Sin llave, la misma frase busca las palabras tal cual y lo explica.
5. Prueba en vivo del adapter: `QATU_IA_PRUEBAS=1 npx jest test/busqueda` en `backend/` (usa la llave del .env).

## Validación local (2026-11-25)

- **Backend (`test/busqueda/busqueda.test.ts`):** validación de la salida del modelo (ids inventados, tipos incompatibles, precios y fechas inválidos, campos extra, caracteres de control), prioridad de filtros manuales, límites de entrada, adapter con fetch falso (lo que se envía, 429/402/5xx, JSON inválido, cancelación), caso de uso en cada respaldo, e integración HTTP con PostgreSQL y un OpenRouter falso local (modo natural con la oferta real, respuesta basura, IA lenta cortada a los 3 s, Origin ajeno 403).
- **Navegador (`frontend/tests/descubrimiento/busqueda-ia.spec.ts`):** 5 de 5 — frase → filtros en la URL con la nota de interpretación; API caída → palabras tal cual; Enter desde la portada; quitar un criterio vuelve la búsqueda convencional; motivo desconocido sin mensajes inventados.
- **Pendiente:** EQ-10 (50 consultas etiquetadas) con la llave real, y medir el costo por búsqueda.
