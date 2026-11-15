# Modelo de datos — Coordinación por WhatsApp

Migración `backend/migrations/usuarios/003-whatsapp.sql` (con su `.down`).

| Tabla | Columna | Tipo | Regla |
|---|---|---|---|
| usuarios | whatsapp | text NULL | `CHECK (whatsapp ~ '^\+519[0-9]{8}$')` |
| usuarios | whatsapp_visible | boolean NOT NULL DEFAULT false | `CHECK (NOT whatsapp_visible OR whatsapp IS NOT NULL)` |

No hay tablas nuevas en Reservas: el contacto se calcula al consultar con la fachada de Usuarios. El número no forma parte del tipo `Usuario` que usan el listado y la administración; solo aparece en el perfil propio (`GET/PATCH /usuarios/me`) y en el contacto de una reserva.
