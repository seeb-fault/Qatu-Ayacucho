import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { etapasAbiertas } from '../../src/modules/resenas/dominio/evidencias';
import type { ReservaParaResena } from '../../src/modules/resenas/dominio/resenas';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const HORA = 3_600_000;
const reserva = (estado: string, cerradaEn: string | null = null): ReservaParaResena => ({ id: 'r', clienteId: 'c', propietarioId: 'p', proveedorId: 'v', publicacionId: 'o', titulo: 'Taladro', tipo: 'herramienta', estado, cerradaEn });
/** PNG mínimo válido: firma correcta y bytes aleatorios para que cada archivo tenga otra huella. */
const png = () => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), randomBytes(64)]);

test('etapas: entrega mientras la herramienta está con el cliente; devolución y trabajo hasta 48 h tras el cierre', () => {
  const ahora = Date.UTC(2026, 10, 11, 12);
  assert.deepEqual(etapasAbiertas(reserva('ACEPTADA'), ahora), []);
  assert.deepEqual(etapasAbiertas(reserva('EN_CURSO'), ahora), ['entrega']);
  assert.deepEqual(etapasAbiertas(reserva('DEVOLUCION_PENDIENTE'), ahora), ['devolucion']);
  assert.deepEqual(etapasAbiertas(reserva('DEVUELTA', new Date(ahora - 47 * HORA).toISOString()), ahora), ['devolucion']);
  assert.deepEqual(etapasAbiertas(reserva('DEVUELTA', new Date(ahora - 49 * HORA).toISOString()), ahora), []);
  assert.deepEqual(etapasAbiertas(reserva('SERVICIO_EN_CURSO'), ahora), ['trabajo']);
  assert.deepEqual(etapasAbiertas(reserva('SERVICIO_CERRADO', new Date(ahora - HORA).toISOString()), ahora), ['trabajo']);
});

test('evidencias reales en PostgreSQL: etapa, cupo, formato, privacidad de descarga y retención', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-evidencias-pruebas-2026-490'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  process.env.DOCUMENTOS_KEY ||= randomBytes(32).toString('hex');
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool), hash = await new ScryptPasswords().crear(h.password);
  const tercero = await usuarios.crear('evidencias-tercero-' + randomUUID() + '@example.com', 'Tercero', hash);
  const admin = await usuarios.crear('evidencias-admin-' + randomUUID() + '@example.com', 'Admin evidencias', hash);
  await pool.query("INSERT INTO roles_usuario(usuario_id, rol) VALUES ($1, 'admin')", [admin.id]);
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  const subir = (id: string, etapa: string, fotos: { datos: Buffer; tipo: string }[], cookie: string) => {
    const form = new FormData(); form.set('etapa', etapa);
    fotos.forEach((f, i) => form.append('fotos', new Blob([f.datos], { type: f.tipo }), `foto-${i}.png`));
    return fetch(`${root}/reservas/${id}/evidencias`, { method: 'POST', headers: { Origin: process.env.APP_ORIGIN!, Cookie: cookie }, body: form });
  };
  try {
    const [cliente, proveedor, ajeno, administrador] = [await login(h.clienteEmail), await login(h.proveedorEmail), await login(tercero.email), await login(admin.email)];
    const paso = async (s: any, accion: string, cookie: string) => { const r = await pedir(`/reservas/${s.id}/${accion}`, 'POST', { versionActual: s.version }, cookie); const b = await r.json(); assert.equal(r.status, 201, accion + ': ' + JSON.stringify(b.mensaje ?? b.code)); return b; };
    const desde = Date.now() + 48 * HORA;
    const creada = await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente);
    assert.equal(creada.status, 201);
    let s = await paso(await creada.json(), 'aceptacion', proveedor);

    await context.test('antes de la entrega no hay etapa abierta', async () => {
      assert.equal((await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }], cliente)).status, 409);
      assert.deepEqual((await (await pedir(`/reservas/${s.id}/evidencias`, 'GET', undefined, cliente)).json()).etapasAbiertas, []);
    });

    s = await paso(await paso(s, 'efectivo', proveedor), 'recepcion', cliente);
    let primera = '', contenido = Buffer.alloc(0);

    await context.test('participantes suben fotos de entrega; terceros y anónimos no', async () => {
      contenido = png();
      const r = await subir(s.id, 'entrega', [{ datos: contenido, tipo: 'image/png' }, { datos: png(), tipo: 'image/png' }], proveedor);
      assert.equal(r.status, 201);
      const items = (await r.json()).items; primera = items[0].id;
      assert.equal(items[0].autor, 'proveedor'); assert.equal(items[0].sha256, createHash('sha256').update(contenido).digest('hex'));
      assert.equal((await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }], ajeno)).status, 404);
      assert.equal((await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }], '')).status, 401);
      assert.equal((await subir(s.id, 'devolucion', [{ datos: png(), tipo: 'image/png' }], cliente)).status, 409);
    });

    await context.test('formato y cupo: solo JPG/PNG reales y como máximo 4 por etapa', async () => {
      assert.equal((await subir(s.id, 'entrega', [{ datos: Buffer.from('%PDF-1.4 falso %%EOF'), tipo: 'image/png' }], cliente)).status, 400);
      assert.equal((await subir(s.id, 'entrega', [{ datos: Buffer.from('%PDF-1.4\n%%EOF'), tipo: 'application/pdf' }], cliente)).status, 400);
      assert.equal((await subir(s.id, 'otra', [{ datos: png(), tipo: 'image/png' }], cliente)).status, 400);
      const r = await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }, { datos: png(), tipo: 'image/png' }, { datos: png(), tipo: 'image/png' }], cliente);
      assert.equal(r.status, 409); assert.equal((await r.json()).code, 'CUPO_EVIDENCIAS');
      assert.equal((await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }, { datos: png(), tipo: 'image/png' }], cliente)).status, 201);
      assert.equal((await subir(s.id, 'entrega', [{ datos: png(), tipo: 'image/png' }], cliente)).status, 409);
      const lista = await (await pedir(`/reservas/${s.id}/evidencias`, 'GET', undefined, cliente)).json();
      assert.equal(lista.items.length, 4); assert.deepEqual(lista.items.map((e: any) => e.autor).sort(), ['cliente', 'cliente', 'proveedor', 'proveedor']);
    });

    await context.test('descarga: participantes y admin reciben el archivo original; un tercero, 404', async () => {
      for (const cookie of [cliente, proveedor, administrador]) {
        const r = await pedir(`/evidencias/${primera}/archivo`, 'GET', undefined, cookie);
        assert.equal(r.status, 200); assert.match(r.headers.get('content-disposition') ?? '', /^attachment/); assert.match(r.headers.get('content-security-policy') ?? '', /sandbox/);
        assert.ok(Buffer.from(await r.arrayBuffer()).equals(contenido));
      }
      assert.equal((await pedir(`/evidencias/${primera}/archivo`, 'GET', undefined, ajeno)).status, 404);
      const cifrado = (await pool.query('SELECT contenido FROM evidencias WHERE id=$1', [primera])).rows[0].contenido as Buffer;
      assert.ok(!cifrado.includes(contenido.subarray(8)), 'la base guarda el contenido cifrado');
    });

    await context.test('retención: a los 90 días del cierre se borra el contenido y queda la huella', async () => {
      s = await paso(await paso(s, 'devolucion/aviso', cliente), 'devolucion/confirmacion', proveedor);
      assert.equal((await subir(s.id, 'devolucion', [{ datos: png(), tipo: 'image/png' }], cliente)).status, 201, 'devolución abierta tras el cierre');
      await pool.query("UPDATE reservas SET devuelto_en=now()-interval '91 days', devolucion_informada_en=now()-interval '91 days' WHERE id=$1", [s.id]);
      const { Evidencias } = await import('../../src/modules/resenas/aplicacion/evidencias');
      const { PostgresEvidencias } = await import('../../src/modules/resenas/infraestructura/postgres-evidencias');
      const { ConsultaReservas } = await import('../../src/modules/reservas');
      const { EnlacePagos } = await import('../../src/modules/reservas/aplicacion/enlace-pagos');
      const { PostgresReservas } = await import('../../src/modules/reservas/infraestructura/postgres');
      const limpieza = new Evidencias(new PostgresEvidencias(pool), new ConsultaReservas(new PostgresReservas(pool, new EnlacePagos())), { resolver: async () => { throw new Error('sin uso'); } });
      assert.ok(await limpieza.limpiar() >= 5);
      const fila = (await pool.query('SELECT contenido, sha256, eliminada_en FROM evidencias WHERE id=$1', [primera])).rows[0];
      assert.equal(fila.contenido, null); assert.ok(fila.eliminada_en); assert.equal(fila.sha256, createHash('sha256').update(contenido).digest('hex'));
      assert.equal((await pedir(`/evidencias/${primera}/archivo`, 'GET', undefined, cliente)).status, 410);
      const lista = await (await pedir(`/reservas/${s.id}/evidencias`, 'GET', undefined, cliente)).json();
      assert.ok(lista.items.every((e: any) => e.disponible === false));
    });
  } finally { await app.close(); await pool.end(); }
});
