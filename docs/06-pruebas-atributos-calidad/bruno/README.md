# Colección Bruno de la API de Qatu

Pruebas de contrato y de reglas de negocio de la API REST, escritas con [Bruno](https://www.usebruno.com/) (alternativa a Postman cuyas colecciones son archivos de texto versionados en Git). Spec 014, etapa 2.

## Qué prueba

| Carpeta | Casos | Reglas que verifica |
|---|---|---|
| 01 Salud y contrato | 3 | La API y PostgreSQL responden; el contrato OpenAPI está publicado; salud con `no-store` |
| 02 Usuarios y sesión | 11 | Registro solo como cliente; cookie HttpOnly, SameSite=Strict, Path=/api/v1; escritura sin `Origin` → 403 (CSRF); campos fuera del contrato → 400; 401 sin sesión; un cliente no entra a administración (403); el error de login no revela si el correo existe; cerrar sesión revoca el token en el servidor |
| 03 Catálogo | 6 | Búsqueda paginada (≤ 20), ordenada y sin datos privados; cabeceras de caché (1 h en referencias, 30 s en búsqueda, `no-store` en errores); 404 de oferta inexistente; un cliente sin perfil de proveedor no publica |
| 04 Reservas | 10 | Disponibilidad sin identidades; solicitud PENDIENTE sin ids de cuentas; solicitud duplicada → 409; no se solicita la oferta propia (403); un tercero recibe 404; el proveedor la ve en su bandeja; rechazo con motivo y versión nueva; repetir con la versión vieja → 409 |
| 05 Libro de Reclamaciones | 4 | Hoja sin cuenta con número correlativo `LR-AAAA-NNNNNN` y código de consulta; consulta con el código; código incorrecto → 404 |

## Ejecutar

Con el backend compilado (`npm run build` en `backend/`) y una base `_test` migrada:

```bash
DATABASE_URL=postgresql://usuario:clave@127.0.0.1:5433/qatu_bruno_test node docs/06-pruebas-atributos-calidad/scripts/bruno.mjs
```

El script crea un proveedor aprobado con una oferta de servicio y un cliente (fixture de reservas), arranca la API en el puerto 3403, corre la colección con el entorno `ci` y escribe en `reportes/`:

- `reporte.html`: reporte visual por petición y prueba.
- `reporte.json` y `reporte.xml` (JUnit), para el CI.

Los reportes omiten las cabeceras `Cookie` y `Set-Cookie` y los cuerpos de las peticiones: no guardan sesiones ni contraseñas. En el CI corre después de Jest y el HTML queda como artefacto `bruno-reporte`.

Para explorarla a mano, abre esta carpeta en la aplicación de Bruno, elige el entorno `local` (API en 3001) y completa las variables secretas (`clienteEmail`, `proveedorEmail`, `fixturePassword`, `publicacionId`, `recursoId`) con datos de desarrollo.
