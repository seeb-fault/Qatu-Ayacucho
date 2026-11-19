import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { crearApp } from '../../src/app';
import { ETIQUETAS, crearDocumento, documentacionHabilitada } from '../../src/shared/infraestructura/documentacion-api';
import { RUTA_CONTRATO, generarContrato } from '../../scripts/openapi';

// Swagger (014). Sin base de datos: crear la app no se conecta; solo recorre los controladores.
process.env.DATABASE_URL ??= 'postgresql://openapi@127.0.0.1:1/sin-conexion';
process.env.JWT_SECRET ??= 'secreto-exclusivo-openapi-pruebas-2026-qatu-abc';

const METODOS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type Operacion = { summary?: string; description?: string; tags?: string[]; security?: unknown[]; responses: Record<string, { content?: Record<string, { schema?: unknown }> }>; requestBody?: unknown };

async function documento() {
  const app = await crearApp();
  try {
    // Rutas que Nest registra de verdad: cada método con @Get/@Post/... de cada controlador cargado.
    let rutas = 0;
    for (const modulo of app.get(ModulesContainer).values()) {
      for (const { metatype } of modulo.controllers.values()) {
        const prototipo = (metatype as { prototype: object }).prototype;
        rutas += Object.getOwnPropertyNames(prototipo).filter(nombre => Reflect.getMetadata(METHOD_METADATA, (prototipo as Record<string, object>)[nombre] ?? {}) !== undefined).length;
      }
    }
    return { doc: crearDocumento(app), rutas };
  } finally { await app.close(); }
}

test('openapi: documenta todas las rutas con resumen, una etiqueta conocida y respuestas', async () => {
  const { doc, rutas } = await documento();
  const operaciones = Object.entries(doc.paths).flatMap(([ruta, item]) => METODOS.filter(m => (item as Record<string, unknown>)[m]).map(m => ({ ruta, metodo: m, op: (item as Record<string, Operacion>)[m] })));
  assert.equal(operaciones.length, rutas, 'cada ruta de Nest aparece en el contrato');
  assert.ok(rutas > 80);
  const etiquetas = new Set(ETIQUETAS.map(([nombre]) => nombre));
  for (const { ruta, metodo, op } of operaciones) {
    const nombre = `${metodo.toUpperCase()} ${ruta}`;
    assert.ok(op.summary, `${nombre} sin resumen (falta @Doc)`);
    assert.equal(op.tags?.length, 1, `${nombre} debe tener una etiqueta`);
    assert.ok(etiquetas.has(op.tags![0]), `${nombre}: etiqueta desconocida ${op.tags![0]}`);
    assert.ok(Object.keys(op.responses).some(c => /^2\d\d$/.test(c)), `${nombre} sin respuesta exitosa`);
    for (const [codigo, r] of Object.entries(op.responses)) {
      if (Number(codigo) >= 400) assert.deepEqual(r.content?.['application/json']?.schema, { $ref: '#/components/schemas/Error' }, `${nombre} ${codigo} debe usar Error`);
    }
    if (metodo !== 'get') {
      assert.ok(op.requestBody, `${nombre}: las escrituras declaran su cuerpo (aunque sea {})`);
      if (ruta !== '/api/v1/pagos/webhooks/culqi') assert.ok(op.responses['403'], `${nombre}: falta el 403 por Origin`);
    }
  }
  // Las rutas de administración piden sesión y avisan del 403; las públicas no piden sesión.
  for (const { ruta, metodo, op } of operaciones) {
    if (ruta.startsWith('/api/v1/admin/')) {
      assert.ok(op.security?.length, `${metodo} ${ruta} debe pedir sesión`);
      assert.ok(op.responses['401'] && op.responses['403'], `${metodo} ${ruta} debe documentar 401 y 403`);
    }
  }
  for (const ruta of ['/api/v1/publicaciones', '/api/v1/salud', '/api/v1/proveedores/zonas', '/api/v1/reclamaciones/titular']) {
    assert.equal(doc.paths[ruta].get?.security, undefined, `${ruta} es pública`);
  }
  // Sin referencias rotas.
  const texto = JSON.stringify(doc);
  for (const [, nombre] of texto.matchAll(/"#\/components\/schemas\/([^"]+)"/g)) assert.ok(doc.components?.schemas?.[nombre], `esquema inexistente: ${nombre}`);
  // OpenAPI 3.0 ignora lo que acompaña a $ref: nullable debe ir con allOf.
  assert.doesNotMatch(texto, /"\$ref":"[^"]+","nullable"/);
  assert.match(String(doc.info.description), /Origin/);
  assert.deepEqual(Object.keys(doc.components?.securitySchemes ?? {}), ['sesion']);
});

test('openapi: el archivo del repositorio coincide con el código (npm run openapi)', async () => {
  const actual = (await readFile(RUTA_CONTRATO, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(actual, await generarContrato(), 'Ejecuta: npm run openapi');
});

test('openapi: la página se sirve en desarrollo y se apaga en producción salvo QATU_DOCS=1', () => {
  assert.equal(documentacionHabilitada({}), true);
  assert.equal(documentacionHabilitada({ NODE_ENV: 'test' }), true);
  assert.equal(documentacionHabilitada({ NODE_ENV: 'production' }), false);
  assert.equal(documentacionHabilitada({ NODE_ENV: 'production', QATU_DOCS: '1' }), true);
  assert.equal(documentacionHabilitada({ QATU_DOCS: '0' }), false);
});

test('openapi: /api/v1/docs sirve Swagger UI y el JSON; con QATU_DOCS=0 no existe', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  const previo = process.env.QATU_DOCS;
  try {
    delete process.env.QATU_DOCS;
    const app = await crearApp(); await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
    try {
      const pagina = await fetch(base + '/api/v1/docs');
      assert.equal(pagina.status, 200);
      assert.match(pagina.headers.get('content-type') ?? '', /text\/html/);
      const html = await pagina.text();
      assert.match(html, /<title>API Qatu<\/title>/);
      const script = html.match(/src="([^"]*swagger-ui-bundle\.js)"/)?.[1];
      assert.ok(script, 'la página carga swagger-ui-bundle.js');
      // Rutas relativas a la página: así también funcionan a través del proxy de Next (mismo origen).
      const recurso = await fetch(new URL(script!, base + '/api/v1/docs'));
      assert.equal(recurso.status, 200);
      assert.match(recurso.headers.get('content-type') ?? '', /javascript/);
      assert.ok((await recurso.arrayBuffer()).byteLength > 100_000); // consumir el cuerpo libera la conexión para cerrar la app
      const json = await fetch(base + '/api/v1/docs/openapi.json');
      assert.equal(json.status, 200);
      const contrato = await json.json();
      assert.equal(contrato.info.title, 'API Qatu');
      assert.ok(contrato.paths['/api/v1/auth/login'].post);
    } finally { await app.close(); }

    process.env.QATU_DOCS = '0';
    const apagada = await crearApp(); await apagada.listen(0, '127.0.0.1');
    try {
      const respuesta = await fetch(await apagada.getUrl() + '/api/v1/docs/openapi.json');
      assert.equal(respuesta.status, 404);
      await respuesta.arrayBuffer();
    } finally { await apagada.close(); }
  } finally {
    if (previo === undefined) delete process.env.QATU_DOCS; else process.env.QATU_DOCS = previo;
  }
});
