import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { entradaItem, entradaEnvio, huellaEnvio, revisar, type ItemLista } from '../../src/modules/reservas/dominio/lista';

const HORA = 3_600_000, DIA = 24 * HORA;
const base: ItemLista = { id: 'i', clienteId: 'c', publicacionId: 'p', recursoId: 'r', tipo: 'herramienta', inicio: '2026-12-01T14:00:00.000Z', fin: '2026-12-02T14:00:00.000Z', descripcion: '', tarifaVistaCentimos: 4250, creadoEn: '2026-11-15T00:00:00.000Z' };

test('dominio: fechas futuras, estados de revisión y huella de envío', () => {
  const ahora = Date.parse('2026-11-15T12:00:00Z');
  assert.throws(() => entradaItem({ publicacionId: randomUUID(), recursoId: randomUUID(), inicio: '2026-11-15T11:00:00.000Z', fin: '2026-11-16T11:00:00.000Z' }, ahora));
  assert.throws(() => entradaItem({ publicacionId: randomUUID(), recursoId: randomUUID(), inicio: '2026-11-20T11:00:00.000Z', fin: '2026-11-20T10:00:00.000Z' }, ahora));
  assert.throws(() => entradaItem({ publicacionId: randomUUID(), recursoId: randomUUID(), inicio: '2026-11-20T11:00:00.000Z', fin: '2026-11-21T11:00:00.000Z', clienteId: 'x' }, ahora));
  const oferta = { tarifaCentimos: 4250, recursoActivo: true };
  assert.equal(revisar(base, ahora, oferta, false), 'listo');
  assert.equal(revisar(base, ahora, null, false), 'inactiva');
  assert.equal(revisar(base, ahora, { ...oferta, recursoActivo: false }, false), 'inactiva');
  assert.equal(revisar(base, Date.parse('2026-12-01T15:00:00Z'), oferta, false), 'fechas_vencidas');
  assert.equal(revisar(base, ahora, { ...oferta, tarifaCentimos: 5000 }, false), 'tarifa_cambiada');
  assert.equal(revisar({ ...base, tipo: 'servicio', tarifaVistaCentimos: null }, ahora, { ...oferta, tarifaCentimos: null }, false), 'listo');
  assert.equal(revisar(base, ahora, oferta, true), 'no_disponible');
  const a = randomUUID(), b = randomUUID();
  assert.equal(huellaEnvio([a, b], true), huellaEnvio([b, a], true));
  assert.notEqual(huellaEnvio([a], true), huellaEnvio([a], false));
  assert.deepEqual(entradaEnvio(undefined), { ids: null, aceptaCondiciones: false });
  assert.throws(() => entradaEnvio({ ids: [] }));
});

test('Mi lista con PostgreSQL real: privacidad, límites, revisión y envío idempotente', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-lista-pruebas-2026-009'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '', extra: Record<string, string> = {}) => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  const rango = (dias: number, duracion = DIA) => { const inicio = Date.now() + dias * DIA; return { inicio: new Date(inicio).toISOString(), fin: new Date(inicio + duracion).toISOString() }; };
  const item = (dias: number) => ({ publicacionId: h.publicacionId, recursoId: h.recursoId, ...rango(dias) });
  try {
    const [cliente, proveedor] = [await login(h.clienteEmail), await login(h.proveedorEmail)];
    const clienteId = (await pool.query('SELECT id FROM usuarios WHERE email_normalizado=lower($1)', [h.clienteEmail])).rows[0].id as string;
    const solicitudes = async () => (await pool.query('SELECT count(*)::integer AS n FROM reservas WHERE cliente_id=$1', [clienteId])).rows[0].n as number;

    await context.test('sin sesión no hay lista; el proveedor no guarda su propia oferta', async () => {
      assert.equal((await pedir('/lista')).status, 401);
      assert.equal((await pedir('/lista/items', 'POST', item(5))).status, 401);
      assert.equal((await pedir('/lista/items', 'POST', item(5), proveedor)).status, 403);
    });

    let primero = '';
    await context.test('guardar no crea solicitudes; un duplicado exacto se rechaza', async () => {
      const antes = await solicitudes(), datos = item(5);
      const r = await pedir('/lista/items', 'POST', datos, cliente);
      assert.equal(r.status, 201);
      const creado = await r.json(); primero = creado.id;
      assert.equal(creado.total, 1); assert.equal(creado.tarifaVistaCentimos, 4250);
      assert.equal(await solicitudes(), antes);
      assert.equal((await pedir('/lista/items', 'POST', datos, cliente)).status, 409);
      assert.deepEqual(await (await pedir('/lista/resumen', 'GET', undefined, cliente)).json(), { total: 1 });
    });

    await context.test('la lista es privada: otra cuenta no la ve ni la modifica', async () => {
      assert.deepEqual((await (await pedir('/lista', 'GET', undefined, proveedor)).json()).items, []);
      assert.equal((await pedir('/lista/items/' + primero, 'DELETE', {}, proveedor)).status, 404);
      assert.equal((await pedir('/lista/items/' + primero + '/tarifa', 'POST', {}, proveedor)).status, 404);
    });

    await context.test('la revisión marca tarifa cambiada, fechas vencidas y unidad ocupada', async () => {
      await pool.query('UPDATE reservas_lista_items SET tarifa_vista_centimos=1000 WHERE id=$1', [primero]);
      const vencido = randomUUID(), pasado = Date.now() - 2 * DIA;
      await pool.query(`INSERT INTO reservas_lista_items(id,cliente_id,publicacion_id,recurso_id,tipo,inicio,fin,tarifa_vista_centimos) VALUES($1,$2,$3,$4,'herramienta',$5,$6,4250)`,
        [vencido, clienteId, h.publicacionId, h.recursoId, new Date(pasado).toISOString(), new Date(pasado + DIA).toISOString()]);
      // Otra reserva aceptada ocupa la unidad en las fechas de un tercer ítem.
      const ocupado = item(9);
      const otra = await (await pedir('/reservas', 'POST', { ...ocupado, aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente)).json();
      assert.equal((await pedir('/reservas/' + otra.id + '/aceptacion', 'POST', { versionActual: otra.version }, proveedor)).status, 201);
      const tercero = await (await pedir('/lista/items', 'POST', ocupado, cliente)).json();
      const lista = await (await pedir('/lista', 'GET', undefined, cliente)).json();
      const estado = (id: string) => lista.items.find((i: { id: string }) => i.id === id).estado;
      assert.equal(estado(primero), 'tarifa_cambiada'); assert.equal(estado(vencido), 'fechas_vencidas'); assert.equal(estado(tercero.id), 'no_disponible');
      const corregido = await (await pedir('/lista/items/' + primero + '/tarifa', 'POST', {}, cliente)).json();
      assert.equal(corregido.tarifaVistaCentimos, 4250);
      assert.equal((await pedir('/lista/items/' + tercero.id, 'DELETE', {}, cliente)).status, 204);
    });

    await context.test('enviar crea una solicitud por ítem, deja los rechazados con su motivo y no se repite', async () => {
      const antes = await solicitudes(), clave = 'envio-' + randomUUID().slice(0, 12);
      assert.equal((await pedir('/lista/envio', 'POST', { aceptaCondiciones: true }, cliente)).status, 400);
      const r = await pedir('/lista/envio', 'POST', { aceptaCondiciones: true }, cliente, { 'Idempotency-Key': clave });
      assert.equal(r.status, 201);
      const { resultados } = await r.json();
      const enviado = resultados.find((x: { itemId: string }) => x.itemId === primero);
      assert.equal(enviado.estado, 'enviado'); assert.ok(enviado.solicitudId);
      const rechazado = resultados.find((x: { estado: string }) => x.estado === 'rechazado');
      assert.ok(rechazado?.motivo);
      assert.equal(await solicitudes(), antes + 1);
      const quedan = (await (await pedir('/lista', 'GET', undefined, cliente)).json()).items.map((i: { id: string }) => i.id);
      assert.deepEqual(quedan, [rechazado.itemId]);
      const repetido = await pedir('/lista/envio', 'POST', { aceptaCondiciones: true }, cliente, { 'Idempotency-Key': clave });
      assert.deepEqual((await repetido.json()).resultados, resultados);
      assert.equal(await solicitudes(), antes + 1);
      assert.equal((await pedir('/lista/envio', 'POST', { aceptaCondiciones: false }, cliente, { 'Idempotency-Key': clave })).status, 409);
      const visible = await (await pedir('/reservas/' + enviado.solicitudId, 'GET', undefined, proveedor)).json();
      assert.equal(visible.estado, 'PENDIENTE');
      assert.equal((await pedir('/lista/items/' + rechazado.itemId, 'DELETE', {}, cliente)).status, 204);
    });

    await context.test('dos envíos a la vez no duplican la solicitud de un ítem', async () => {
      const nuevo = await (await pedir('/lista/items', 'POST', item(14), cliente)).json(), antes = await solicitudes();
      const enviar = () => pedir('/lista/envio', 'POST', { aceptaCondiciones: true }, cliente, { 'Idempotency-Key': 'par-' + randomUUID().slice(0, 14) }).then(x => x.json());
      const [a, b] = await Promise.all([enviar(), enviar()]);
      const enviados = [...a.resultados, ...b.resultados].filter((x: { itemId: string; estado: string }) => x.itemId === nuevo.id && x.estado === 'enviado');
      assert.equal(enviados.length, 1);
      assert.equal(await solicitudes(), antes + 1);
    });

    await context.test('la lista admite hasta 20 ítems', async () => {
      for (let i = 0; i < 20; i++) assert.equal((await pedir('/lista/items', 'POST', { ...item(20 + i), fin: new Date(Date.now() + (20 + i) * DIA + HORA).toISOString() }, cliente)).status, 201);
      const lleno = await pedir('/lista/items', 'POST', item(45), cliente);
      assert.equal(lleno.status, 409); assert.equal((await lleno.json()).code, 'LISTA_LLENA');
    });
  } finally { await app.close(); await pool.end(); }
});
