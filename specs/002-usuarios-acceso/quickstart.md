# Validación y recorrido — Usuarios y acceso

## Preparación

US1/US2/US3 ejecutables localmente. Seguir backend/README.md para configurar DATABASE_URL, JWT_SECRET, APP_ORIGIN, migración y arranque. Para integración usar una base exclusiva de pruebas; TEST_DATABASE_URL habilita las suites HTTP/PostgreSQL, que restablecen únicamente sus cuotas IP de ensayo y generan cuentas sintéticas. Sin esa variable la integración se omite explícitamente. US3 prueba un fallo de auditoría con un trigger temporal que se elimina al terminar: nunca usar una base ajena a pruebas.

Desde backend: npm run build, npm run migrate, npm test. Desde frontend: npm run build, npm test para descubrimiento y npm run test:usuarios para navegador/API/PostgreSQL reales. El ensayo web inicia API en 3001 y web en 3100 con APP_ORIGIN coincidente; necesita DATABASE_URL y JWT_SECRET en el entorno o backend/.env.

## Recorridos

1. US1: dado email válido sin registrar, completo el registro; comprobar que se crea una sola cuenta y no se expone el hash.
2. US2: dado una sesión válida, edito mi perfil; comprobar que solo cambian mis datos permitidos.
3. US3: dado un administrador autorizado, desactiva una cuenta; comprobar que el acceso se revoca según política de sesión y se audita la acción.

## Casos críticos

- Email duplicado normalizado y dos registros concurrentes: una sola cuenta.
- Matriz cliente/proveedor/admin/anónimo: acciones ajenas rechazadas, incluso con IDs manipulados.
- Contraseña incorrecta, cuenta inactiva y límite de intentos; sin credenciales en logs.

## Registro de resultados

El primer registro corresponde al incremento US1/US2. La sección US3 al final documenta el estado actualizado.

| Campo | Valor |
|---|---|
| Commit/versiones/entorno | 2026-10-19, Windows/PowerShell, Node 24.21.0, npm 11.19.0, PostgreSQL 18.4; base Git 8d91c2e con cambios locales sin commit. NestJS 11 y versiones exactas en backend/package-lock.json; Next 16.4.1. |
| Fixture y condiciones | Clúster aislado .local-postgres/ (ignorado), loopback:5433; bases qatu_test y qatu_web_test, emails UUID en example.com. Docker instalado pero daemon apagado; se usaron initdb/pg_ctl locales. |
| Comandos ejecutados | backend: npm run migrate (incluida repetición), npm run build, TEST_DATABASE_URL apuntando a qatu_test y npm test. frontend: npm run typecheck, npm run build, npm test y npm run test:usuarios con DATABASE_URL=qatu_web_test y secreto efímero. |
| Resultados positivos/negativos | Backend: 10 pruebas pasan, 0 omitidas; registro concurrente 201/409 y una cuenta, hash salado, campos privados ausentes, cookie HttpOnly/Strict, perfil, rechazo de escalamiento/IDs, anónimo/origen ajeno, logout con cookie reutilizada, expiración en BD, contraseña incorrecta, JWT inválido, cuenta inactiva y cuota 429. Chrome: 2 pruebas de usuarios pasan (registro→recarga→edición→logout→login y perfil anónimo/formularios a 360 px). Regresión de descubrimiento: 13 pruebas pasan. Compilaciones API/web y typecheck correctos. |
| Medidas EQ-04/EQ-05 | Evidencia parcial de autorización US1/US2. Dominio sin imports NestJS/pg; repositorios privados al módulo y fachada pública solo de identidad. No equivale a aceptar EQ-04/EQ-05 globales ni a medir rendimiento. |
| Limitaciones y fallos | Sin US3, auditoría administrativa, recuperación de contraseña, renovación, OpenAPI estructurado ni despliegue. La desactivación se ensayó mediante SQL controlado, no mediante un endpoint administrativo. Catálogo sintético. Cuota por IP compartida detrás de proxy y limpieza de filas expiradas pendientes antes de publicación. |

[Escenarios fuente](../../docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) · [Plan](./plan.md).

## Incremento US3 — 2026-10-19

Base Git e617c0b, cambios locales sin commit. Mismo entorno Windows/Node 24.21.0/npm 11.19.0/PostgreSQL 18.4. API NestJS 11 y Next 16.4.1; sin nuevas dependencias.

- Migración 002 aplicada sobre qatu_test ya existente con 001; migrate repetido sin pérdida ni doble aplicación. Ensayo web sobre bases independientes qatu_us3_web_test y qatu_us3_final_web con migraciones 001/002 desde cero. Todo en clúster aislado .local-postgres, loopback:5433; emails UUID en example.com y secretos de sesión efímeros.
- Backend: npm run build y npm test con TEST_DATABASE_URL=qatu_test. Resultado: 19 pruebas pasan, 0 omitidas. Incluye aprovisionamiento CLI sin promover email existente, matriz completa de acceso a rutas administrativas, paginación 20/3 y filtros literales, UUID/DTO inválidos, admins protegidos incluso con cambios cruzados concurrentes y rechazo de origen ajeno.
- Persistencia: dos cambios de estado concurrentes producen 200/409 y un único evento. Desactivar revoca todas las sesiones; reactivar permite login nuevo pero mantiene inválidas las cookies anteriores. Login simultáneo con desactivación no deja sesiones utilizables. Actor/rol se validan de nuevo dentro de la transacción.
- Atomicidad: trigger de ensayo rechaza insertar auditoría; HTTP 503 sin stack, estado/versión y sesiones permanecen intactos. Se retiran trigger y función al finalizar. Evidencia dentro de backend/test/usuarios/administracion.test.ts.
- Frontend: npm run build y npm run test:usuarios. Cuatro pruebas pasan con Chrome/API/PostgreSQL reales: US1/US2 y administrar→desactivar→consultar auditoría→reactivar→nuevo login, además de acceso directo anónimo/cliente rechazado. Pantalla a 360 px sin scroll horizontal; captura local ignorada en frontend/test-results/usuarios-administracion-360.png revisada visualmente. El primer ensayo detectó un selector de test ambiguo por el anunciador de Next.js; se corrigió acotándolo a la región administrativa.
- Regresión: npm test desde frontend, 13 pruebas de descubrimiento pasan. Compilaciones API/web correctas. Imports revisados: dominio puro, aplicación consume puertos, datos solo de Usuarios, fachada pública conserva solo identidad. git diff --check sin incidencias.

Total de los ejecutores: 19 backend + 4 web Usuarios + 13 descubrimiento = 36 pruebas aprobadas. Este resultado cubre Usuarios localmente; EQ-04/EQ-05 globales y mediciones del sistema completo siguen pendientes.

Para usar US3: migrar la base, aprovisionar cuenta nueva con npm run admin:crear siguiendo el ingreso seguro de variables en backend/README.md, ingresar y abrir /admin/usuarios desde el perfil. No se crean cuentas administrativas personales automáticamente; las usadas en ensayos son sintéticas.

Pendientes: OpenAPI estructurado, revisión humana, recuperación de contraseña, renovación de sesión, limpieza de filas expiradas y despliegue. D02 de proveedores sigue abierta: bloquear acceso no cancela/reactiva publicaciones ni reservas. Auditoría sin endpoint de edición/borrado; protección del acceso SQL y copias operativas siguen bajo 008.
