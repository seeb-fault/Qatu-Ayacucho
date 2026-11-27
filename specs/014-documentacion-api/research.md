# Investigación — Documentación y pruebas de contrato de la API

## Punto de partida (2026-11-19)

Los contratos estaban en Markdown (`docs/03-diseño-de-software/diseño-externo/contratos-api.md` y `specs/*/contracts/api.md`) y varios decían «OpenAPI estructurado pendiente». El Sprint 2 pide endpoints documentados con OpenAPI/Swagger.

## Decisiones (2026-11-19, Santiago Noe)

- **`@nestjs/swagger` generando desde el código.** El contrato sale de los mismos controladores que atienden las peticiones. Un archivo OpenAPI escrito a mano se desalinea con el primer cambio.
- **Un decorador `@Doc` por endpoint en vez de clases DTO.** Las entradas se validan en el dominio con funciones (`entradaHoja`, `filtros`…), no con `class-validator`. Crear clases solo para Swagger duplicaría las reglas en dos sitios. `@Doc` describe el cuerpo con esquemas JSON cortos y deduce lo demás (método, código de éxito, 401/403 por acceso, 403 por `Origin`).
- **Apagado en producción por defecto.** La página muestra el mapa completo de la API; no hace falta para operar. `QATU_DOCS=1` la enciende para una revisión.
- **Probar por el frontend.** La API exige `Origin` igual a `APP_ORIGIN`. Abierta en `http://localhost:3000/api/v1/docs` (proxy de Next), la página es del mismo origen: el navegador guarda la cookie y las escrituras pasan. No se relajó la protección CSRF.
- **Sin servicios externos.** `validatorUrl: null` evita que Swagger UI envíe la URL del contrato a `validator.swagger.io`; `scarfSettings.enabled=false` desactiva la telemetría de instalación de `swagger-ui-dist`.
- **Contrato en el repositorio y comprobado en `npm test`.** Sirve como evidencia de entrega, como entrada para Bruno y para revisar cambios de contrato en los PR.

## Alternativas descartadas

- **Escribir `openapi.yaml` a mano:** se desalinea y no se comprueba.
- **Plugin del CLI de Nest (`@nestjs/swagger/plugin`):** infiere desde clases DTO y tipos; Qatu no tiene DTO de clase y compila con `tsc`/`tsx`, sin el CLI de Nest.
- **Validar con Redocly en el CI:** queda para la etapa 2; por ahora la prueba propia revisa referencias rotas, `nullable` junto a `$ref`, etiquetas y respuestas.
