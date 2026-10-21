# Qatu Ayacucho

Alquiler de herramientas y servicios de oficios en Ayacucho. Proyecto académico de Arquitectura de Software de Noe Yupanqui Santiago.

## Reconstrucción por entregas

Este repositorio reconstruye, en commits pequeños y ramas por especificación, trabajo previamente realizado en [el repositorio original](https://github.com/santiago-noe/Qatu-arquitSoft-02-Noe_Yupanqui_Santiago-). No representa desarrollo nuevo ni fechas históricas recreadas. El original conserva su historial completo y no se modifica.

Etapa actual: **003 — Proveedores y verificación**, incorporada sobre Descubrimiento 001 y Usuarios 002. Incluye perfiles privados/públicos, documentos cifrados, revisión administrativa e historial. El catálogo sigue siendo sintético. **004 — Catálogo y publicaciones continúa pendiente de implementación**; también quedan las decisiones operativas y de mapas indicadas en las especificaciones.

Para ejecutar: `cd frontend`, `npm ci`, `npm run dev`; abrir http://127.0.0.1:3000. Validación: `npm run build` y `npm test`. Detalles en [frontend/README.md](frontend/README.md).

Para las cuentas, iniciar PostgreSQL con `docker compose up -d db` y configurar `backend/.env` según [backend/README.md](backend/README.md). En `backend`, ejecutar `npm ci`, `npm run migrate` y `npm run dev`. Las credenciales del ejemplo son exclusivamente locales; no publicar `.env`.

Proveedores: `/proveedor`, `/proveedores/:id` y `/admin/proveedores`. Para adjuntos privados configurar una `DOCUMENTOS_KEY` estable y protegida en el backend; instrucciones y límites operativos en [backend/PROVEEDORES.md](backend/PROVEEDORES.md). Usar archivos sintéticos durante las pruebas locales; no subir documentos reales a GitHub.

## Validación por entrega

Cada rama incorpora su especificación y commits separados de documentos, migraciones, backend, interfaz y pruebas. Las ejecuciones nuevas están en [GitHub Actions](https://github.com/seeb-fault/Qatu-Ayacucho/actions) y los [pull requests](https://github.com/seeb-fault/Qatu-Ayacucho/pulls). No confundirlas con los resultados históricos conservados en los quickstarts del original.

El CI de 001 solo ejecuta descubrimiento; 002 añade usuarios y acceso; 003 añade proveedores y límites de carga. Los módulos pendientes no se presentan como probados. La estrategia y los checks obligatorios están documentados en [.github/CI.md](.github/CI.md).

## Documentación

- [Análisis del sistema](docs/01-analisis-de-sistema/)
- [Arquitectura de software](docs/02-arquitectura-software/)
- [Diseño de software](docs/03-diseño-de-software/)
- [Modelos C4](docs/04-modelo-c4/)
- [Ingeniería inversa](docs/05-ingenieria-inversa/)
- [Especificaciones](specs/README.md)
- [Flujo de CI y ramas](.github/CI.md)
- [Procedencia de esta reconstrucción](docs/RECONSTRUCCION.md)

No subir secretos, archivos `.env`, bases de datos locales ni documentos reales de identidad.
