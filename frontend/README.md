# Qatu Web — descubrimiento, cuentas y proveedores

Implementación local de la especificación 001 y Usuarios 002 US1/US2/US3 con Next.js, React y TypeScript. Rutas: inicio (/), resultados (/buscar), detalle (/publicaciones/:id), guía de estados (/demo), registro (/registro), ingreso (/ingresar), perfil (/cuenta) y administración (/admin/usuarios).

Proveedores 003 incorpora /proveedor para alta/edición/solicitud documental propia, /proveedores/:id como página pública de visibilidad explícita y /admin/proveedores para revisar documentación. Crear perfil no lo aprueba; el estado público proviene de revisión real del administrador, con archivos privados y motivo auditado. El catálogo no está integrado aún con esos perfiles.

## Ejecutar

Usar Node.js 22 o superior (validado con 24.21.0). Desde esta carpeta:

```powershell
npm ci
npm run dev
```

Abrir http://127.0.0.1:3000. Para revisar una compilación de producción:

```powershell
npm run build
npm start
```

El servidor se limita a loopback para vista previa local. El despliegue VPS se preparará en la entrega 008.

## Verificar

Acceso y registro usan un diseño adaptable de dos columnas, navegación entre formularios, opción de mostrar/ocultar contraseña y estados de envío/error. No cambian los contratos de autenticación ni añaden proveedores de acceso externos.

Tras `npm run build`, ejecutar `$env:QATU_TEST_PORT='3200'; npm run test:acceso` para comprobar el diseño a 1440, 768 y 360 px, errores y redirección al perfil. Esta suite intercepta la API con datos sintéticos y no necesita PostgreSQL ni modifica cuentas reales. Genera capturas en `test-results/acceso-*.png`.

```powershell
npm run typecheck
npm run build
npm test
```

Las pruebas levantan y cierran su propio servidor de producción en http://127.0.0.1:3001 y necesitan Chrome instalado en su ruta habitual de Windows. QATU_TEST_PORT y QATU_BROWSER permiten cambiar puerto y ejecutable. Se debe compilar antes de ejecutarlas. Las capturas/trazas locales se guardan en test-results y se excluyen de Git.

## Fuente de datos y alcance

24 ofertas sintéticas en src/lib/catalogo.ts; el adapter src/lib/api/publicaciones.ts devuelve fixtures locales. El catálogo todavía no tiene persistencia. Precios, perfiles de proveedores, reseñas y verificaciones del catálogo son ficticios y se identifican en la interfaz. Usuarios usa API NestJS y PostgreSQL reales: configurar y arrancar backend siguiendo [su README](../backend/README.md). Next.js reenvía /api/v1 al puerto 3001; QATU_API_URL permite cambiarlo antes de compilar.

La búsqueda convencional combina texto por términos sin tildes con tipo/categoría/distrito/presupuesto. El presupuesto está en soles por unidad publicada; excluye servicios sin precio comparable. Paginación de 20 y orden determinista. Los criterios viajan en la URL y se conservan al volver del detalle.

Registro/login, edición del nombre propio y logout operan con sesión HttpOnly y revocación en servidor. Administración exige admin activo; permite buscar/paginar cuentas, activar/desactivar con motivo y consultar auditoría. Crear admin por CLI según backend/README.md; el perfil administrativo enlaza /admin/usuarios. Desactivar revoca sesiones y reactivar exige login nuevo. No hay IA, publicación, reservas, pago ni mapa real; esas acciones futuras abren un aviso. Error/reintento, vacío, publicación desactivada e imagen ausente se pueden explorar desde /demo. El error de consulta simulado usa escenario=error; el reintento elimina solo ese parámetro, conservando los filtros.

`npm run test:usuarios` inicia API en 3001 y web en 3100, requiere base exclusiva de pruebas ya migrada y DATABASE_URL/JWT_SECRET (entorno o backend/.env). Ejecuta el recorrido con Chrome y persistencia real. `npm test` mantiene las 13 pruebas de descubrimiento sin backend; no ejecutar simultáneamente ambas suites en el puerto 3001. Resultados de este incremento en [quickstart 002](../specs/002-usuarios-acceso/quickstart.md).

`npm run test:proveedores` reutiliza esos puertos y verifica perfiles, privacidad, ediciones concurrentes, carga y revisión con adjuntos sintéticos. Requiere DOCUMENTOS_KEY además de DATABASE_URL/JWT_SECRET y migraciones 001/002 de Proveedores. Ejecutar secuencialmente con las otras suites. El proxy admite 12 MiB para 2×5 MiB más multipart; consultas JSON tienen deadline de 10 s y cargas de 120 s. La clave se configura solo en backend, nunca en variables NEXT_PUBLIC_*.

## Archivos principales

- src/app: rutas, layouts, estilos y estados de Next.js.
- src/components/descubrimiento: navegación, buscador, tarjeta, galería y avisos.
- src/lib: tipos, fixtures, filtros y adapter local.
- public/ilustraciones: SVG originales del prototipo; no reutilizan recursos de Hygglo/Taskrabbit.
- tests/descubrimiento: pruebas de navegación, filtros, errores, teclado y ancho de pantalla.

Tipografías DM Sans/Manrope solicitadas a Google Fonts con fallback de sistema; las ilustraciones se sirven localmente. Si no hay conexión de fuentes, la navegación sigue operativa. Esta fase no acredita EQ-06 completo ni las integraciones del MVP.

[Especificación](../specs/001-descubrimiento-ofertas/spec.md) · [Registro de validación](../specs/001-descubrimiento-ofertas/quickstart.md).
