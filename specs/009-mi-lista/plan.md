# Plan — Mi lista

## Enfoque

Etapa 1 dentro del módulo Reservas: el ítem de la lista es una solicitud en borrador. El envío reutiliza el caso de uso de solicitud de 005, así que las reglas de fechas, disponibilidad y tarifa no se duplican.

## Capas

- **Dominio** (`backend/src/modules/reservas/dominio/lista.ts`): validación de ítems (fechas en America/Lima, descripción, límites), estados de revisión y puerto del repositorio.
- **Aplicación** (`backend/src/modules/reservas/aplicacion/lista.ts`): agregar, listar con revalidación contra Catálogo y disponibilidad, quitar y enviar con idempotencia.
- **Infraestructura** (`backend/src/modules/reservas/infraestructura/postgres-lista.ts`, `backend/migrations/reservas/011-lista.sql`): tabla, índices y bloqueo por cliente.
- **Presentación** (`backend/src/modules/reservas/presentacion/lista.controller.ts`): rutas de contracts/api.md.
- **Web**: botón «Agregar a mi lista» en el detalle de publicación, contador en el encabezado, página `frontend/src/app/lista/page.tsx` y regreso tras el ingreso en `Acceso.tsx`.

## Riesgos

- Redirección abierta en `?siguiente=`: validar en un solo helper con pruebas de casos maliciosos.
- Envío parcial: cada ítem en su propia transacción; el resultado por ítem queda registrado con la clave de idempotencia.
- Carga: la revalidación de 20 ítems usa consultas por lote a Catálogo y Reservas, no una por ítem.

## Pruebas

Unitarias de dominio, integración con PostgreSQL real (límite, duplicado, lista ajena, envío repetido y concurrente) y recorrido de navegador a 360 y 1440 px. Registrar resultados en quickstart.md.
