import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { crearApp } from '../../src/app';
import { distanciaMetros, entradaUbicacion, puntoPublico } from '../../src/modules/catalogo/dominio/ubicacion';

const PLAZA = { lat: -13.160227, lng: -74.225762 }; // Plaza de Armas de Huamanga
const DIA = 86_400_000;

test('dominio: zona de servicio y punto público exacto o casi exacto', () => {
  assert.deepEqual(entradaUbicacion({ ...PLAZA, precision: 'exacta' }), { ...PLAZA, precision: 'exacta' });
  for (const malo of [{ lat: -12.04, lng: -77.03, precision: 'exacta' }, { lat: '-13.16', lng: -74.22, precision: 'exacta' }, { ...PLAZA, precision: 'cercana' }, { ...PLAZA, precision: 'exacta', extra: 1 }])
    assert.throws(() => entradaUbicacion(malo));
  const proveedor = randomUUID();
  assert.deepEqual(puntoPublico(proveedor, PLAZA, 'exacta'), PLAZA);
  const publico = puntoPublico(proveedor, PLAZA, 'aproximada'), d = distanciaMetros(PLAZA, publico);
  assert.ok(d >= 49 && d <= 101, `desplazamiento de ${d} m`);
  // Mismo proveedor y mismo lugar: mismo punto, para que varias ofertas no permitan promediar.
  assert.deepEqual(puntoPublico(proveedor, PLAZA, 'aproximada'), publico);
  assert.notDeepEqual(puntoPublico(randomUUID(), PLAZA, 'aproximada'), publico);
});

test('ubicación con PostgreSQL real: dueño, público y contraparte de la reserva', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-ubicacion-pruebas-2026-011'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  const ruta = '/publicaciones/' + h.publicacionId;
  try {
    const [cliente, proveedor] = [await login(h.clienteEmail), await login(h.proveedorEmail)];

    await context.test('solo el dueño marca la ubicación, dentro de la zona de servicio', async () => {
      assert.equal((await pedir(ruta + '/ubicacion', 'PUT', { ...PLAZA, precision: 'aproximada' })).status, 401);
      assert.equal((await pedir(ruta + '/ubicacion', 'PUT', { ...PLAZA, precision: 'aproximada' }, cliente)).status, 404);
      assert.equal((await pedir(ruta + '/ubicacion', 'PUT', { lat: -12.04, lng: -77.03, precision: 'aproximada' }, proveedor)).status, 400);
      const r = await pedir(ruta + '/ubicacion', 'PUT', { ...PLAZA, precision: 'aproximada' }, proveedor);
      assert.equal(r.status, 200);
      const guardada = await r.json();
      assert.deepEqual({ lat: guardada.lat, lng: guardada.lng }, PLAZA);
    });

    await context.test('el público ve un punto a 50–100 m y nunca el exacto', async () => {
      const texto = await (await pedir(ruta)).text(), oferta = JSON.parse(texto);
      assert.equal(oferta.ubicacion.precision, 'aproximada');
      const d = distanciaMetros(PLAZA, oferta.ubicacion);
      assert.ok(d >= 49 && d <= 101, `desplazamiento de ${d} m`);
      assert.ok(!texto.includes(String(PLAZA.lat)) && !texto.includes(String(PLAZA.lng)), 'el detalle público no debe contener el punto exacto');
      const lista = await (await pedir('/publicaciones?limit=50')).text();
      assert.ok(!lista.includes(String(PLAZA.lat)), 'el listado público no debe contener el punto exacto');
      assert.equal((await pedir(ruta + '/ubicacion', 'GET', undefined, cliente)).status, 404);
      assert.deepEqual(await (await pedir(ruta + '/ubicacion', 'GET', undefined, proveedor)).json(), { ubicacion: { ...PLAZA, precision: 'aproximada', publica: { lat: oferta.ubicacion.lat, lng: oferta.ubicacion.lng } } });
    });

    await context.test('la contraparte de una reserva aceptada recibe el punto exacto; antes, no', async () => {
      const desde = Date.now() + 4 * DIA;
      const s = await (await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + DIA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente)).json();
      assert.equal((await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, cliente)).status, 409);
      assert.equal((await pedir('/reservas/' + s.id + '/aceptacion', 'POST', { versionActual: s.version }, proveedor)).status, 201);
      const contacto = await (await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, cliente)).json();
      assert.deepEqual(contacto.ubicacion, PLAZA);
    });

    await context.test('un local abierto al público muestra el punto exacto; quitarla oculta el mapa', async () => {
      assert.equal((await pedir(ruta + '/ubicacion', 'PUT', { ...PLAZA, precision: 'exacta' }, proveedor)).status, 200);
      assert.deepEqual((await (await pedir(ruta)).json()).ubicacion, { ...PLAZA, precision: 'exacta' });
      assert.equal((await pedir(ruta + '/ubicacion', 'DELETE', {}, proveedor)).status, 204);
      assert.equal((await (await pedir(ruta)).json()).ubicacion, null);
      assert.deepEqual(await (await pedir(ruta + '/ubicacion', 'GET', undefined, proveedor)).json(), { ubicacion: null });
    });
  } finally { await app.close(); }
});
