# Validación — Información legal y Libro de Reclamaciones

## Configuración

En `backend/.env` (ver `.env.example`), con los datos reales del titular. Si faltan, las páginas muestran «Por definir».

```
QATU_TITULAR_RAZON_SOCIAL=
QATU_TITULAR_RUC=
QATU_TITULAR_DIRECCION=
QATU_TITULAR_CORREO=
QATU_TITULAR_TELEFONO=
```

Luego, `npm run migrate` y reiniciar el backend.

## Recorrido manual

1. En el pie de página, abrir «Términos y condiciones», «Cancelaciones y devoluciones», «Privacidad», «Contacto» y «Libro de Reclamaciones».
2. Sin iniciar sesión, presentar un reclamo: la constancia muestra el número `LR-AAAA-NNNNNN`, el plazo y el código de consulta; «Imprimir o guardar en PDF».
3. En «Consultar una hoja», escribir el número y el código: aparece la hoja sin respuesta.
4. Con una cuenta de administrador, «Mi perfil» → «Libro de Reclamaciones»: la hoja aparece en «Pendientes» con su vencimiento; registrar la respuesta enviada.
5. Volver a consultar: aparece la respuesta.

## Validación local de la etapa 1 (2026-11-16)

- **Entorno:** Windows, Node.js 24, PostgreSQL/PostGIS 17.5 en Docker, bases nuevas `_test`. No se modificó `.env`.
- **Backend:** `npm test` aprobó **214 de 214**, sin omisiones.
  - `test/resenas/reclamaciones.test.ts`:
    - Validación de la hoja: documentos, apoderado, monto, campos desconocidos.
    - Plazo de 15 días hábiles en hora de Lima, incluso a las 22:00 de un viernes.
    - Con PostgreSQL real:
      - Hoja sin cuenta con constancia y titular; hoja vinculada a la cuenta con sesión.
      - 6 presentaciones simultáneas con números consecutivos.
      - Consulta solo con el código correcto (404 si no).
      - Atención solo con rol de administrador (401/403), con una respuesta única ante dos simultáneas (200/409).
      - Cuota de 3 hojas por documento (429).
      - La base rechaza respuestas incompletas y apoderados incoherentes.
  - `test/usuarios/proxies.test.ts`:
    - Valores de `QATU_PROXIES_CONFIABLES` y `QATU_HOST`.
    - Sin configurar, `X-Forwarded-For` se ignora.
    - Con `loopback` o `uniquelocal` (Dokploy), se toma la IP que escribió el proxy aunque el visitante haya enviado otra.
    - Con PostgreSQL real, 30 intentos fallidos de un visitante ya no bloquean el inicio de sesión de otro; `true` impide arrancar.
- **Migración:** `resenas/004-libro-reclamaciones` se aplicó, se revirtió y se volvió a aplicar.
- **Navegador, suite `test:resenas`: 5 de 5.** `tests/resenas/reclamaciones.spec.ts`:
  - Las cinco páginas se abren desde el pie, sin desborde a 360 px, y muestran «Por definir» sin titular configurado.
  - Un visitante sin cuenta presenta un reclamo. Un DNI de 7 dígitos muestra el error del backend, y el monto «35,50» se registra como S/ 35.50.
  - La constancia trae número, código y plazo, sin desborde a 360 px.
  - Un administrador lo responde desde `/admin/reclamaciones`, y la consulta pública rechaza un código incorrecto y muestra la respuesta con el correcto.
- **Hallazgo durante la validación:** `scripts/correr-pruebas.sh` no compilaba el backend, y las suites lo arrancan desde `dist/`; una corrida local podía probar código anterior. Ahora compila antes de las suites. En CI no ocurría porque ya compilaba.
- **Pendiente:** las otras 7 suites se ejecutaron con un `dist/` anterior a esta rama y aprobaron. Se confirman en CI con todo compilado.
