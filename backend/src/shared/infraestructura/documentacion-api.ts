import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEGURIDAD_SESION, esquemasRegistrados } from '../presentacion/openapi';

/** Ruta de la página de Swagger y del contrato en JSON (014). */
export const RUTA_DOCS = 'api/v1/docs';
export const RUTA_OPENAPI = 'api/v1/docs/openapi.json';

export const ETIQUETAS: Array<[string, string]> = [
  ['Salud', 'Estado de la API para Docker, Dokploy y el monitoreo'],
  ['Usuarios', 'Registro, inicio y cierre de sesión, perfil propio'],
  ['Proveedores', 'Perfil de proveedor y verificación documental'],
  ['Catálogo', 'Publicaciones de herramientas y oficios, búsqueda y ubicación'],
  ['Búsqueda', 'Búsqueda en lenguaje natural con IA y respaldo convencional'],
  ['Mi lista', 'Lista de solicitudes antes de enviarlas'],
  ['Reservas', 'Solicitudes, cotizaciones, apartado, entrega, devolución y servicio'],
  ['Pagos', 'Pago en línea en modo de prueba (Culqi)'],
  ['Avisos', 'Avisos dentro de la aplicación'],
  ['Reseñas', 'Calificaciones de reservas cerradas y reputación pública'],
  ['Evidencias', 'Fotos privadas de entrega, devolución y trabajo'],
  ['Incidencias', 'Reclamos de una reserva y garantía documental'],
  ['Libro de Reclamaciones', 'Hoja de reclamación virtual (Ley 29571)'],
  ['Administración', 'Revisión de cuentas, proveedores, publicaciones, reseñas, incidencias y reclamaciones'],
];

/** La página se sirve en desarrollo y pruebas. En producción, solo con QATU_DOCS=1. */
export function documentacionHabilitada(entorno: NodeJS.ProcessEnv = process.env) {
  if (entorno.QATU_DOCS === '1') return true;
  if (entorno.QATU_DOCS === '0') return false;
  return entorno.NODE_ENV !== 'production';
}

function versionPaquete(): string {
  // dist/src/... y src/... quedan a dos o tres niveles de package.json; se busca hacia arriba.
  for (const ruta of ['../../../package.json', '../../../../package.json']) {
    try { return JSON.parse(readFileSync(resolve(__dirname, ruta), 'utf8')).version; } catch { /* siguiente */ }
  }
  return '0.0.0';
}

export function crearDocumento(app: INestApplication): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle('API Qatu')
    .setDescription([
      'API REST de Qatu, marketplace de alquiler de herramientas y oficios en Ayacucho. NestJS sobre Express, Node.js y PostgreSQL.',
      '',
      '**Convenciones**',
      '- Base `/api/v1`, JSON, fechas ISO 8601 en UTC; dinero en céntimos enteros de PEN.',
      '- Sesión: cookie `qatu_sesion` HttpOnly, SameSite=Strict, Path=/api/v1, válida 15 minutos. Se obtiene con `POST /auth/login` o `POST /auth/registro`; el token nunca va en el JSON.',
      '- Escrituras (POST, PUT, PATCH, DELETE): `Origin` igual a `APP_ORIGIN` y `Content-Type: application/json`; si no, 403 `ORIGEN_INVALIDO`.',
      '- Todo error responde `{ code, mensaje, correlationId }`, sin detalles internos. Cada respuesta trae la cabecera `X-Correlation-Id`.',
      '- Las respuestas no se guardan en caché salvo que se indique (`Cache-Control: no-store`).',
      '',
      '**Probar desde esta página:** ábrela por el frontend (`http://localhost:3000/api/v1/docs`), así el navegador envía el Origin correcto y guarda la cookie. Ejecuta primero `POST /auth/login`; las demás operaciones usan esa sesión.',
    ].join('\n'))
    .setVersion(versionPaquete())
    .addCookieAuth('qatu_sesion', { type: 'apiKey', in: 'cookie', name: 'qatu_sesion', description: 'La fija el servidor al iniciar sesión. No se copia a mano: el navegador la envía solo.' }, SEGURIDAD_SESION);
  for (const [nombre, descripcion] of ETIQUETAS) builder.addTag(nombre, descripcion);

  const documento = SwaggerModule.createDocument(app, builder.build(), {
    autoTagControllers: false,
    operationIdFactory: (controlador, metodo) => `${controlador.replace(/Controller$/, '')}_${metodo}`,
  });
  documento.components = {
    ...documento.components,
    schemas: {
      ...documento.components?.schemas,
      Error: {
        type: 'object', required: ['code', 'mensaje', 'correlationId'],
        properties: {
          code: { type: 'string', example: 'ENTRADA_INVALIDA', description: 'Código estable para el programa' },
          mensaje: { type: 'string', example: 'Revisa los datos enviados.', description: 'Mensaje para la persona, en español' },
          correlationId: { type: 'string', format: 'uuid', description: 'Identificador para buscar la petición en los registros' },
        },
      },
      ...esquemasRegistrados(),
    },
  };
  declararParametrosDeRuta(documento);
  return documento;
}

/**
 * Parámetros iguales con cualquier compilador. Cada {nombre} de una ruta es un parámetro obligatorio. Swagger solo lo infiere si el compilador emite los tipos
 * (SWC sí, tsx no); así el contrato es el mismo con cualquiera. En Qatu todos los identificadores son UUID.
 */
function declararParametrosDeRuta(documento: OpenAPIObject) {
  for (const [ruta, item] of Object.entries(documento.paths)) {
    const nombres = [...ruta.matchAll(/\{([^}]+)\}/g)].map(([, nombre]) => nombre);
    for (const metodo of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operacion = item[metodo];
      if (!operacion) continue;
      const otros = (operacion.parameters ?? []).filter(p => !('in' in p) || p.in !== 'path');
      const deRuta = nombres.map(name => ({ name, in: 'path' as const, required: true, schema: { type: 'string' as const, format: 'uuid' }, description: 'Identificador (UUID)' }));
      // Con tipos emitidos, Swagger también deduce las cabeceras de @Headers(): se deja una por nombre, la documentada.
      const unicos = new Map<string, (typeof otros)[number]>();
      for (const p of otros) {
        const clave = 'in' in p ? `${p.in}:${p.name.toLowerCase()}` : JSON.stringify(p);
        const previo = unicos.get(clave);
        if (!previo || (!('description' in previo && previo.description) && 'description' in p && p.description)) unicos.set(clave, p);
      }
      operacion.parameters = [...deRuta, ...unicos.values()];
    }
  }
}

/** Publica la página de Swagger en /api/v1/docs y el JSON en /api/v1/docs/openapi.json. */
export function publicarDocumentacion(app: INestApplication) {
  const documento = crearDocumento(app);
  SwaggerModule.setup(RUTA_DOCS, app, documento, {
    useGlobalPrefix: false,
    jsonDocumentUrl: RUTA_OPENAPI,
    yamlDocumentUrl: undefined,
    customSiteTitle: 'API Qatu',
    // validatorUrl null: Swagger UI no envía la URL del contrato a validator.swagger.io.
    swaggerOptions: { validatorUrl: null, withCredentials: true, docExpansion: 'none', tagsSorter: 'none', operationsSorter: 'none', displayRequestDuration: true, tryItOutEnabled: false },
  });
}
