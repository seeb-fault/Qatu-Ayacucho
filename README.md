# Qatu Ayacucho

Alquiler de herramientas y servicios de oficios en Ayacucho. Proyecto académico de Arquitectura de Software de Noe Yupanqui Santiago.

## Reconstrucción por entregas

Este repositorio reconstruye, en commits pequeños y ramas por especificación, trabajo previamente realizado en [el repositorio original](https://github.com/santiago-noe/Qatu-arquitSoft-02-Noe_Yupanqui_Santiago-). No representa desarrollo nuevo ni fechas históricas recreadas. El original conserva su historial completo y no se modifica.

Etapa actual: **002 — Usuarios y acceso**, con API NestJS/PostgreSQL, registro, login, perfil, logout y administración auditada. El catálogo sigue siendo sintético. Proveedores 003 se incorporará mediante su propio pull request. La especificación 004 aún no está implementada.

Para ejecutar: `cd frontend`, `npm ci`, `npm run dev`; abrir http://127.0.0.1:3000. Validación: `npm run build` y `npm test`. Detalles en [frontend/README.md](frontend/README.md).

Para las cuentas, iniciar PostgreSQL con `docker compose up -d db` y configurar `backend/.env` según [backend/README.md](backend/README.md). En `backend`, ejecutar `npm ci`, `npm run migrate` y `npm run dev`. Las credenciales del ejemplo son exclusivamente locales; no publicar `.env`.

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
