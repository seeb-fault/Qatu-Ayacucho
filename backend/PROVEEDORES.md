# Proveedores y verificación local

Perfiles propios, visibilidad explícita, distritos manuales, documentos privados cifrados, revisión administrativa e historial. Módulo independiente que usa IdentidadUsuarios; no consulta sus tablas ni asigna roles directamente. Catálogo continúa con fixtures.

## Preparar

Con PostgreSQL y backend/.env configurados según README.md, ejecutar desde backend:

```powershell
npm run migrate
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guardar una vez la clave generada como DOCUMENTOS_KEY en backend/.env. Son 64 caracteres hex; debe conservarse estable entre reinicios y protegerse separada de los datos. No publicar la clave ni rotarla sin migrar documentos existentes. Con clave ausente/inválida, perfiles y lectura pública funcionan pero la recepción documental queda deshabilitada. JWT_SECRET mantiene su configuración independiente.

Arrancar backend y frontend. Desde /cuenta abrir «Mi perfil de proveedor» (/proveedor). Completar nombre público, descripción y distrito. La página pública requiere marcar consentimiento de visibilidad; omitirlo mantiene el perfil privado. Correo, usuarioId y documentación no se muestran públicamente.

## Verificar

Enviar 1–2 PDF/JPEG/PNG de hasta 5 MiB cada uno y aceptar conservación. Las pruebas usan exclusivamente archivos sintéticos; no se incluyeron datos personales en el repositorio. El servidor valida tamaño/firma/MIME, cifra antes de persistir y guarda solicitud/snapshot/adjuntos juntos. No conserva el nombre original. Hasta tres solicitudes por 24 horas y una pendiente por proveedor.

Crear administrador con npm run admin:crear siguiendo README.md. Ingresar con otra cuenta administrativa y abrir «Revisar proveedores» (/admin/proveedores). Descargar adjuntos y decidir aprobar/rechazar con motivo. El dueño no puede resolver su propia solicitud aunque sea admin. Decisiones concurrentes no duplican resoluciones. La cola filtra pendientes, aprobadas, rechazadas y canceladas, con 20 solicitudes por página.

Durante revisión solo se puede cambiar visibilidad; al cambiar nombre/descripción/zona después de resolución se reinicia verificación. El perfil público presenta el estado real sin documentación ni motivos. Aprobación documental es revisión humana; no acredita integración de publicación, pagos o garantías del oficio.

## Conservación elegida por el usuario

Archivos reales conservados mientras el proveedor esté activo. En el incremento actual se utiliza cuenta activa de Usuarios; desactivación operativa del proveedor sigue pendiente de D02. Descargas rechazan de inmediato cuentas propietarias inactivas. Limpieza al arrancar y cada hora elimina contenido/IV/tag al detectar inactividad, conserva decisiones/snapshot/metadatos y cancela solicitudes pendientes. Si se reactiva tras eliminación, debe enviar nuevamente los archivos.

Ejecución manual desde backend:

```powershell
npm run documentos:limpiar
```

El comando también funciona sin DOCUMENTOS_KEY porque no descifra. Repetirlo no recupera ni vuelve a eliminar adjuntos ya purgados. La decisión de eliminar se toma al detectar inactividad, incluso si una reactivación coincide con ese lote. En 008 programar y monitorizar limpieza con la API apagada, copias/restauración, retención de WAL/backups y custodia de claves; la eliminación de filas no garantiza borrado físico instantáneo de copias.

Antes de operación pública quedan por validar HTTPS, criterios humanos de verificación, límites operativos de almacenamiento/carga, análisis adicional de archivos, política de copias y revisión de privacidad. D02 y mapas externos permanecen pendientes; la selección manual funciona sin API de mapas.

## Verificación técnica

backend: npm run build y npm test con TEST_DATABASE_URL de una base exclusiva ya migrada. Las suites verifican cifrado/tampering, 201/409 concurrentes, acceso propio/ajeno/admin/anónimo, autoevaluación, fallo de escritura y eliminación de inactivos conservando historial.

frontend: npm run build, npm run test:proveedores, npm run test:usuarios y npm test. Las suites usan puertos 3001/3100 y deben ejecutarse secuencialmente. Proveer DATABASE_URL, JWT_SECRET y DOCUMENTOS_KEY al entorno de pruebas; las claves de ensayo son efímeras y la base no debe contener documentos reales. El proxy Next.js tiene buffer de 12 MiB para aceptar 2×5 MiB más multipart; la carga permite hasta 120 s, las consultas JSON mantienen 10 s. proxyClientMaxBodySize es experimental en la versión fijada y deberá revisarse en 008 al configurar el proxy HTTPS. Ejemplos y resultados en specs/003-proveedores-verificacion/quickstart.md.

Referencias técnicas: [NestJS archivos](https://docs.nestjs.com/techniques/file-upload), [Node crypto](https://nodejs.org/api/crypto.html), [PostgreSQL RETURNING](https://www.postgresql.org/docs/18/dml-returning.html).
