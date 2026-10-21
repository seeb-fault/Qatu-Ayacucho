# Qatu Web — descubrimiento 001

Reconstrucción de la especificación 001 con Next.js, React y TypeScript. Rutas: inicio (/), resultados (/buscar), detalle (/publicaciones/:id) y guía de estados (/demo). /cuenta muestra un aviso de funcionalidad futura: todavía no hay formularios de cuentas ni backend.

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

```powershell
npm run typecheck
npm run build
npm test
```

Las pruebas levantan y cierran su propio servidor de producción en http://127.0.0.1:3001. En Windows local se usa Chrome; en CI/Linux, Chromium instalado mediante `npx playwright install --with-deps chromium`. QATU_TEST_PORT y QATU_BROWSER permiten cambiar puerto y ejecutable. Se debe compilar antes de ejecutar las pruebas. Las capturas/trazas locales se guardan en test-results y se excluyen de Git.

## Fuente de datos y alcance

24 ofertas sintéticas en src/lib/catalogo.ts; el adapter src/lib/api/publicaciones.ts devuelve fixtures locales. El catálogo todavía no tiene persistencia. Precios, perfiles de proveedores, reseñas y verificaciones del catálogo son ficticios y se identifican en la interfaz. Esta entrega no tiene API de usuarios ni PostgreSQL.

La búsqueda convencional combina texto por términos sin tildes con tipo/categoría/distrito/presupuesto. El presupuesto está en soles por unidad publicada; excluye servicios sin precio comparable. Paginación de 20 y orden determinista. Los criterios viajan en la URL y se conservan al volver del detalle.

No hay registro/login, administración, IA, publicación, reservas, pago ni mapa real; las acciones futuras muestran un aviso. Error/reintento, vacío, publicación desactivada e imagen ausente se pueden explorar desde /demo. El error de consulta simulado usa escenario=error; el reintento elimina solo ese parámetro, conservando los filtros.

`npm test` ejecuta las 13 pruebas de descubrimiento sin backend. Los resultados anteriores del snapshot se conservan en el quickstart; los checks de este repositorio son ejecuciones nuevas y deben revisarse en Actions.

## Archivos principales

- src/app: rutas, layouts, estilos y estados de Next.js.
- src/components/descubrimiento: navegación, buscador, tarjeta, galería y avisos.
- src/lib: tipos, fixtures, filtros y adapter local.
- public/ilustraciones: SVG originales del prototipo; no reutilizan recursos de Hygglo/Taskrabbit.
- tests/descubrimiento: pruebas de navegación, filtros, errores, teclado y ancho de pantalla.

Tipografías DM Sans/Manrope solicitadas a Google Fonts con fallback de sistema; las ilustraciones se sirven localmente. Si no hay conexión de fuentes, la navegación sigue operativa. Esta fase no acredita EQ-06 completo ni las integraciones del MVP.

[Especificación](../specs/001-descubrimiento-ofertas/spec.md) · [Registro de validación](../specs/001-descubrimiento-ofertas/quickstart.md).
