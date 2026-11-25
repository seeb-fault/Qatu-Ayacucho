# 015 — Comportamiento de la base de datos y estrategia de caché

**Estado:** etapa 1 (015.1) implementada. **Fecha:** 2026-11-25.
**Módulos técnicos:** compartido (caché en memoria), catálogo (decoradores de caché), reservas (consulta de la bandeja). **Historias:** requisito del Sprint 2, actividad 5: «Analizar el comportamiento de la base de datos y la estrategia de caché».

## Objetivo y alcance

Medir cómo responde PostgreSQL a las consultas reales de la API con un volumen representativo, corregir lo que el análisis muestre y reducir las idas a la base en las lecturas públicas más frecuentes (búsqueda y detalle del catálogo), sin servir datos privados ni desactualizados más allá de un límite conocido.

- **Etapa 1 (015.1):** analizador de planes (`npm run base:analizar`); optimización de «Mis reservas»; caché en memoria con TTL y LRU para la búsqueda pública y la lista de proveedores habilitados, invalidada por las escrituras del catálogo; cabeceras `Cache-Control` en lecturas públicas; errores siempre con `no-store`; medición con k6 sin caché y con caché.
- **Fuera de alcance:** caché compartida entre réplicas (Redis), caché de datos privados, CDN (spec 013, etapa 3).

## User Scenarios & Testing

### US1 — Saber dónde está el costo (P1)

Como equipo, queremos el plan de ejecución de las consultas principales con datos de carga.
**Prueba independiente:** Dada una base `_test` con 1 000 publicaciones y 5 000 reservas, cuando corre `npm run base:analizar`, entonces `docs/06-pruebas-atributos-calidad/base-de-datos/planes.json` guarda, por consulta, el tiempo, los índices usados y los bloques leídos.

### US2 — Búsqueda pública sin ir a la base cada vez (P1)

Como visitante, quiero que la búsqueda responda rápido aunque muchas personas busquen a la vez.
**Prueba independiente:** Dada la caché activa, cuando 20 peticiones iguales llegan a la vez, entonces la base se consulta una sola vez; y cuando un proveedor publica o edita, la siguiente búsqueda ya lo refleja.
**Caso negativo:** las vistas del dueño y del administrador, el detalle que usa Reservas y cualquier dato con sesión no pasan por la caché; un error nunca se guarda ni se marca como cacheable.

## Requisitos

- **M015-FR01:** TTL configurable con `QATU_CACHE_SEGUNDOS` (0–300; 30 por defecto; 0 en pruebas). Con 0 no se guarda nada.
- **M015-FR02:** Límite de 500 entradas con desalojo LRU; peticiones simultáneas iguales comparten una lectura; los errores no se guardan.
- **M015-FR03:** Toda escritura del catálogo (crear, editar, moderar, ubicar) vacía la caché de búsqueda y la de proveedores habilitados, aunque falle.
- **M015-FR04:** Desactualización máxima conocida: un cambio de un proveedor (verificación, visibilidad, cuenta inactiva) se ve en la búsqueda a más tardar al vencer el TTL; con varias réplicas, igual para escrituras de otra réplica.
- **M015-FR05:** `Cache-Control: public, max-age=3600` en categorías y distritos; `public, max-age=30` en búsqueda y detalle públicos; `no-store` en todo lo demás y en cualquier respuesta de error.

## Criterios de aceptación

- **AC01:** `test/catalogo/cache.test.ts` pasa (unitarias de la caché y de los decoradores, e integración HTTP de las cabeceras).
- **AC02:** La bandeja «Mis reservas» usa el índice por cuenta y lee menos bloques que antes.
- **AC03:** k6 con caché frente a sin caché, mismo perfil de 2 000 usuarios, registrado en `docs/06-pruebas-atributos-calidad/base-de-datos/README.md`.
