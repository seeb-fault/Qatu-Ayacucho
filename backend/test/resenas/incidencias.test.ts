import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { entradaIncidencia, entradaResolucion, puedeReclamar } from '../../src/modules/resenas/dominio/incidencias';
import type { ReservaParaResena } from '../../src/modules/resenas/dominio/resenas';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const HORA = 3_600_000;
const reserva = (estado: string, cerradaEn: string | null = null): ReservaParaResena => ({ id: 'r', clienteId: 'c', propietarioId: 'p', proveedorId: 'v', publicacionId: 'o', titulo: 'Taladro', tipo: 'herramienta', estado, cerradaEn });
const DESCRIPCION = 'La broca llegó partida y el maletín sin el cargador.';

test('dominio: se reclama desde la entrega hasta 48 h tras el cierre; entradas validadas', () => {
  const ahora = Date.UTC(2026, 10, 12, 12);
  assert.equal(puedeReclamar(reserva('ACEPTADA'), ahora), false);
  assert.equal(puedeReclamar(reserva('EN_CURSO'), ahora), true);
  assert.equal(puedeReclamar(reserva('DEVUELTA', new Date(ahora - 47 * HORA).toISOString()), ahora), true);
  assert.equal(puedeReclamar(reserva('DEVUELTA', new Date(ahora - 49 * HORA).toISOString()), ahora), false);
  assert.equal(puedeReclamar(reserva('SERVICIO_EN_CURSO'), ahora), true);
  assert.deepEqual(entradaIncidencia({ tipo: 'dano', descripcion: `  ${DESCRIPCION}  ` }), { tipo: 'dano', descripcion: DESCRIPCION });
  for (const malo of [{ tipo: 'robo', descripcion: DESCRIPCION }, { tipo: 'dano', descripcion: 'corto' }, { tipo: 'dano', descripcion: DESCRIPCION, monto: 10 }])
    assert.throws(() => entradaIncidencia(malo), /tipo|caracteres|Revisa/);
  assert.throws(() => entradaResolucion({ resultado: 'devolver_dinero', motivo: 'Motivo suficiente.' }), /resultado/);
});

test('incidencias y garantía reales en PostgreSQL', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-incidencias-pruebas-2026-491'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  process.env.DOCUMENTOS_KEY ||= randomBytes(32).toString('hex');
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool), hash = await new ScryptPasswords().crear(h.password);
  const tercero = await usuarios.crear('incidencias-tercero-' + randomUUID() + '@example.com', 'Tercero', hash);
  const admin = await usuarios.crear('incidencias-admin-' + randomUUID() + '@example.com', 'Admin incidencias', hash);
  await pool.query("INSERT INTO roles_usuario(usuario_id, rol) VALUES ($1, 'admin')", [admin.id]);
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  try {
    const [cliente, proveedor, ajeno, administrador] = [await login(h.clienteEmail), await login(h.proveedorEmail), await login(tercero.email), await login(admin.email)];
    const paso = async (s: any, accion: string, cookie: string) => { const r = await pedir(`/reservas/${s.id}/${accion}`, 'POST', { versionActual: s.version }, cookie); const b = await r.json(); assert.equal(r.status, 201, accion + ': ' + JSON.stringify(b.mensaje ?? b.code)); return b; };
    const desde = Date.now() + 48 * HORA;
    const creada = await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente);
    assert.equal(creada.status, 201);
    let s = await paso(await creada.json(), 'aceptacion', proveedor);
    const CONDICIONES = 'Taladro operativo, sin golpes; incluye maletín, dos brocas y cargador.';

    await context.test('garantía: solo el proveedor la registra antes de entregar; el cliente no confirma antes de recibir', async () => {
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: CONDICIONES }, cliente)).status, 403);
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: 'corto' }, proveedor)).status, 400);
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: CONDICIONES, montoCentimos: 5000 }, proveedor)).status, 400, 'no admite montos');
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: 'Versión previa del estado de la herramienta.' }, proveedor)).status, 200);
      const g = await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: CONDICIONES }, proveedor);
      assert.equal(g.status, 200); assert.equal((await g.json()).version, 2);
      assert.equal((await pedir(`/reservas/${s.id}/garantia/conformidad`, 'POST', { version: 2 }, cliente)).status, 409, 'aún no la recibe');
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'GET', undefined, ajeno)).status, 404);
    });

    s = await paso(await paso(s, 'efectivo', proveedor), 'recepcion', cliente);

    await context.test('garantía: el cliente confirma la versión vigente y luego el acuerdo queda fijo', async () => {
      assert.equal((await pedir(`/reservas/${s.id}/garantia/conformidad`, 'POST', { version: 1 }, cliente)).status, 409, 'versión desactualizada');
      assert.equal((await pedir(`/reservas/${s.id}/garantia/conformidad`, 'POST', { version: 2 }, proveedor)).status, 403);
      const r = await pedir(`/reservas/${s.id}/garantia/conformidad`, 'POST', { version: 2 }, cliente);
      assert.equal(r.status, 201); assert.ok((await r.json()).conformidadClienteEn);
      assert.equal((await pedir(`/reservas/${s.id}/garantia`, 'PUT', { condiciones: CONDICIONES + ' Corregido.' }, proveedor)).status, 409);
      const vista = await (await pedir(`/reservas/${s.id}/garantia`, 'GET', undefined, cliente)).json();
      assert.equal(vista.aplica, true); assert.equal(vista.garantia.condiciones, CONDICIONES);
    });

    let incidenciaId = '';
    await context.test('incidencia: participantes la abren; terceros no; una sola abierta por reserva', async () => {
      assert.equal((await pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'dano', descripcion: DESCRIPCION }, ajeno)).status, 404);
      assert.equal((await pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'dano', descripcion: 'corto' }, cliente)).status, 400);
      const [a, b] = await Promise.all([pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'dano', descripcion: DESCRIPCION }, cliente), pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'faltante', descripcion: DESCRIPCION }, proveedor)]);
      assert.deepEqual([a.status, b.status].sort(), [201, 409]);
      const lista = await (await pedir(`/reservas/${s.id}/incidencias`, 'GET', undefined, proveedor)).json();
      assert.equal(lista.items.length, 1); assert.equal(lista.puedeReclamar, false); incidenciaId = lista.items[0].id;
      assert.equal(lista.items[0].estado, 'abierta'); assert.ok(!('clienteId' in lista.items[0]));
    });

    await context.test('resolución: solo un admin ajeno, una vez, con motivo; no mueve dinero', async () => {
      const resolver = (cookie: string, body: unknown) => pedir(`/admin/incidencias/${incidenciaId}/resolucion`, 'PATCH', body, cookie);
      assert.equal((await resolver(cliente, { resultado: 'a_favor_cliente', motivo: 'Intento sin permisos.' })).status, 403);
      assert.equal((await resolver(administrador, { resultado: 'a_favor_cliente', motivo: 'corto' })).status, 400);
      const abiertas = await (await pedir('/admin/incidencias?estado=abierta', 'GET', undefined, administrador)).json();
      assert.ok(abiertas.items.some((i: any) => i.id === incidenciaId));
      const [x, y] = await Promise.all([resolver(administrador, { resultado: 'a_favor_cliente', motivo: 'Las fotos de entrega muestran la broca entera.' }), resolver(administrador, { resultado: 'sin_acuerdo', motivo: 'Segunda decisión simultánea.' })]);
      assert.deepEqual([x.status, y.status].sort(), [200, 409]);
      const fila = (await pool.query('SELECT estado, revisor_id, resultado FROM incidencias WHERE id=$1', [incidenciaId])).rows[0];
      assert.equal(fila.estado, 'resuelta'); assert.equal(fila.revisor_id, admin.id);
      const reservaTras = (await pool.query('SELECT pago_estado, efectivo_centimos FROM reservas WHERE id=$1', [s.id])).rows[0];
      assert.equal(reservaTras.pago_estado, 'CONFIRMADO_PARTICIPANTES'); assert.equal(Number(reservaTras.efectivo_centimos), 4250, 'el dinero no cambia');
      assert.equal((await pedir(`/reservas/${s.id}/incidencias`, 'GET', undefined, cliente).then(r => r.json())).puedeReclamar, true, 'puede abrir otra tras resolverse');
    });

    await context.test('retención: una incidencia abierta conserva las fotos aunque pasen 90 días', async () => {
      const form = new FormData(); form.set('etapa', 'entrega'); form.append('fotos', new Blob([Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), randomBytes(32)])], { type: 'image/png' }), 'f.png');
      assert.equal((await fetch(`${root}/reservas/${s.id}/evidencias`, { method: 'POST', headers: { Origin: process.env.APP_ORIGIN!, Cookie: cliente }, body: form })).status, 201);
      s = await paso(await paso(s, 'devolucion/aviso', cliente), 'devolucion/confirmacion', proveedor);
      assert.equal((await pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'faltante', descripcion: 'Faltó devolver uno de los cargadores del maletín.' }, proveedor)).status, 201);
      const nueva = (await pool.query("SELECT id FROM incidencias WHERE reserva_id=$1 AND estado='abierta'", [s.id])).rows[0].id;
      assert.equal((await pedir(`/admin/incidencias/${nueva}/evidencias`, 'GET', undefined, cliente)).status, 403);
      const fotos = await (await pedir(`/admin/incidencias/${nueva}/evidencias`, 'GET', undefined, administrador)).json();
      assert.equal(fotos.items.length, 1); assert.equal(fotos.items[0].autor, 'cliente'); assert.equal(fotos.items[0].disponible, true);
      await pool.query("UPDATE reservas SET devuelto_en=now()-interval '91 days', devolucion_informada_en=now()-interval '91 days' WHERE id=$1", [s.id]);
      const { Evidencias } = await import('../../src/modules/resenas/aplicacion/evidencias');
      const { PostgresEvidencias } = await import('../../src/modules/resenas/infraestructura/postgres-evidencias');
      const { PostgresIncidencias } = await import('../../src/modules/resenas/infraestructura/postgres-incidencias');
      const { ConsultaReservas } = await import('../../src/modules/reservas');
      const { EnlacePagos } = await import('../../src/modules/reservas/aplicacion/enlace-pagos');
      const { PostgresReservas } = await import('../../src/modules/reservas/infraestructura/postgres');
      const limpieza = new Evidencias(new PostgresEvidencias(pool), new ConsultaReservas(new PostgresReservas(pool, new EnlacePagos())), { resolver: async () => { throw new Error('sin uso'); } }, new PostgresIncidencias(pool));
      await limpieza.limpiar();
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM evidencias WHERE reserva_id=$1 AND contenido IS NOT NULL', [s.id])).rows[0].n, 1, 'conservada con incidencia abierta');
      const abierta = (await pool.query("SELECT id FROM incidencias WHERE reserva_id=$1 AND estado='abierta'", [s.id])).rows[0].id;
      assert.equal((await pedir(`/admin/incidencias/${abierta}/resolucion`, 'PATCH', { resultado: 'a_favor_proveedor', motivo: 'El cliente confirmó el faltante.' }, administrador)).status, 200);
      await limpieza.limpiar();
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM evidencias WHERE reserva_id=$1 AND contenido IS NOT NULL', [s.id])).rows[0].n, 0, 'borrada tras resolverse');
      assert.equal((await pedir(`/reservas/${s.id}/incidencias`, 'POST', { tipo: 'otro', descripcion: 'Reclamo fuera del plazo de cuarenta y ocho horas.' }, cliente)).status, 409);
    });
  } finally { await app.close(); await pool.end(); }
});
