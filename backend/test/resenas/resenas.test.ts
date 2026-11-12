import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { entradaModeracion, entradaResena, exigirElegible, plazoParaResenar, type ReservaParaResena } from '../../src/modules/resenas/dominio/resenas';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const DIA = 86_400_000, HORA = 3_600_000;
const reserva = (cambios: Partial<ReservaParaResena> = {}): ReservaParaResena => ({ id: 'r', clienteId: 'c', propietarioId: 'p', proveedorId: 'v', publicacionId: 'o',
  titulo: 'Taladro', estado: 'DEVUELTA', cerradaEn: new Date(Date.UTC(2026, 10, 1)).toISOString(), ...cambios });

test('entrada: puntuación entera de 1 a 5, comentario opcional de hasta 600 caracteres y sin campos extra', () => {
  assert.deepEqual(entradaResena({ puntuacion: 5, texto: '  Muy buena herramienta  ' }), { puntuacion: 5, texto: 'Muy buena herramienta' });
  assert.deepEqual(entradaResena({ puntuacion: 1 }), { puntuacion: 1, texto: null });
  for (const malo of [{ puntuacion: 0 }, { puntuacion: 6 }, { puntuacion: 4.5 }, { puntuacion: '5' }, { puntuacion: 5, texto: 'x'.repeat(601) }, { puntuacion: 5, clienteId: 'otro' }, null, []])
    assert.throws(() => entradaResena(malo), /ENTRADA_INVALIDA|puntuación|comentario|Revisa/);
  assert.throws(() => entradaModeracion({ oculta: true, motivo: 'corto' }), /motivo/);
  assert.deepEqual(entradaModeracion({ oculta: false, motivo: 'Restablecida tras revisión.' }), { oculta: false, motivo: 'Restablecida tras revisión.' });
});

test('elegibilidad: solo el cliente, con la operación cerrada y dentro de los 14 días', () => {
  const cerrada = reserva(), cierre = Date.parse(cerrada.cerradaEn!);
  assert.equal(plazoParaResenar(cerrada), new Date(cierre + 14 * DIA).toISOString());
  assert.doesNotThrow(() => exigirElegible(cerrada, 'c', cierre + DIA));
  assert.throws(() => exigirElegible(cerrada, 'p', cierre + DIA), /Solo el cliente/);
  assert.throws(() => exigirElegible(reserva({ estado: 'EN_CURSO', cerradaEn: null }), 'c', cierre), /termine/);
  assert.throws(() => exigirElegible(cerrada, 'c', cierre + 14 * DIA), /plazo/);
  assert.doesNotThrow(() => exigirElegible(reserva({ estado: 'SERVICIO_CERRADO' }), 'c', cierre + DIA));
});

const archivos = (raiz: string): string[] => readdirSync(raiz, { withFileTypes: true }).flatMap(e => e.isDirectory() ? archivos(join(raiz, e.name)) : [join(raiz, e.name)]);
test('límites: Reseñas usa la fachada pública de Reservas y Reservas no conoce a Reseñas', () => {
  const propios = archivos('src/modules/resenas').filter(f => /from '\.\.\/(\.\.\/)?reservas\/|(FROM|JOIN|UPDATE|INTO) +reservas(_|\b)/i.test(readFileSync(f, 'utf8')));
  assert.deepEqual(propios, []);
  assert.deepEqual(archivos('src/modules/reservas').filter(f => /resenas/i.test(readFileSync(f, 'utf8'))), []);
});

test('reseñas reales en PostgreSQL: elegibilidad, unicidad, reputación pública y moderación auditada', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-resenas-pruebas-2026-489'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool), hash = await new ScryptPasswords().crear(h.password);
  const tercero = await usuarios.crear('resenas-tercero-' + randomUUID() + '@example.com', 'Tercero', hash);
  const admin = await usuarios.crear('resenas-admin-' + randomUUID() + '@example.com', 'Admin reseñas', hash);
  await pool.query("INSERT INTO roles_usuario(usuario_id, rol) VALUES ($1, 'admin')", [admin.id]);
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  try {
    const [cliente, proveedor, ajeno, administrador] = [await login(h.clienteEmail), await login(h.proveedorEmail), await login(tercero.email), await login(admin.email)];
    let turno = 0;
    const paso = async (s: any, accion: string, cookie: string) => { const r = await pedir('/reservas/' + s.id + '/' + accion, 'POST', { versionActual: s.version }, cookie); const cuerpo = await r.json(); assert.equal(r.status, 201, accion + ': ' + JSON.stringify(cuerpo.mensaje ?? cuerpo.code)); return cuerpo; };
    const aceptada = async () => {
      const desde = Date.now() + (48 + 48 * turno++) * HORA;
      const r = await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente);
      assert.equal(r.status, 201); return paso(await r.json(), 'aceptacion', proveedor);
    };
    // Entrega con efectivo, recepción, aviso y confirmación de la devolución: la herramienta queda DEVUELTA.
    const cerrada = async () => {
      let s = await paso(await aceptada(), 'efectivo', proveedor);
      s = await paso(s, 'recepcion', cliente); s = await paso(s, 'devolucion/aviso', cliente); s = await paso(s, 'devolucion/confirmacion', proveedor);
      assert.equal(s.estado, 'DEVUELTA'); return s;
    };
    const resenar = (s: any, body: unknown, cookie = cliente) => pedir('/reservas/' + s.id + '/resena', 'POST', body, cookie);

    await context.test('no se reseña una operación sin cerrar', async () => {
      const s = await aceptada();
      assert.equal((await resenar(s, { puntuacion: 5 })).status, 409);
      assert.equal((await (await pedir('/reservas/' + s.id + '/resena', 'GET', undefined, cliente)).json()).puedeResenar, false);
      // Liberar la unidad: una entrega anticipada posterior ocupa desde ahora y chocaría con este apartado.
      assert.equal((await pedir('/reservas/' + s.id + '/cancelacion', 'POST', { versionActual: s.version, motivo: 'Ya no necesito la herramienta.' }, cliente)).status, 201);
    });

    const s = await cerrada();
    const proveedorId = (await pool.query('SELECT proveedor_id FROM reservas WHERE id=$1', [s.id])).rows[0].proveedor_id;

    await context.test('permisos y validación: proveedor 403, tercero 404, anónimo 401, entrada inválida 400', async () => {
      const estado = await (await pedir('/reservas/' + s.id + '/resena', 'GET', undefined, cliente)).json();
      assert.equal(estado.puedeResenar, true); assert.equal(estado.resena, null); assert.ok(estado.plazo);
      assert.equal((await resenar(s, { puntuacion: 5 }, proveedor)).status, 403);
      assert.equal((await resenar(s, { puntuacion: 5 }, ajeno)).status, 404);
      assert.equal((await resenar(s, { puntuacion: 5 }, '')).status, 401);
      assert.equal((await resenar(s, { puntuacion: 0 })).status, 400);
      assert.equal((await resenar(s, { puntuacion: 5, proveedorId })).status, 400);
    });

    await context.test('dos envíos simultáneos dejan una sola reseña', async () => {
      const estados = (await Promise.all([resenar(s, { puntuacion: 4, texto: 'Buen estado y puntual.' }), resenar(s, { puntuacion: 4, texto: 'Buen estado y puntual.' })])).map(r => r.status).sort();
      assert.deepEqual(estados, [201, 409]);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM resenas WHERE reserva_id=$1', [s.id])).rows[0].n, 1);
      assert.equal((await (await pedir('/reservas/' + s.id + '/resena', 'GET', undefined, cliente)).json()).puedeResenar, false);
    });

    await context.test('la reputación pública no expone al cliente ni a la reserva', async () => {
      const publico = await (await pedir('/proveedores/' + proveedorId + '/resenas')).json();
      assert.equal(publico.total, 1); assert.equal(publico.promedio, 4); assert.equal(publico.items[0].texto, 'Buen estado y puntual.');
      assert.deepEqual(Object.keys(publico.items[0]).sort(), ['creadaEn', 'id', 'puntuacion', 'texto', 'titulo']);
      assert.deepEqual((await (await pedir('/resenas/resumen?proveedores=' + proveedorId)).json())[proveedorId], { total: 1, promedio: 4 });
      assert.equal((await pedir('/resenas/resumen?proveedores=no-es-uuid')).status, 400);
    });

    await context.test('fuera del plazo de 14 días ya no se puede reseñar', async () => {
      const vieja = await cerrada();
      // Solo se mueve la fecha de cierre en la base de prueba; la regla de dominio no cambia.
      await pool.query("UPDATE reservas SET devuelto_en=now()-interval '15 days', devolucion_informada_en=now()-interval '15 days' WHERE id=$1", [vieja.id]);
      const r = await resenar(vieja, { puntuacion: 3 });
      assert.equal(r.status, 409); assert.equal((await r.json()).code, 'PLAZO_VENCIDO');
    });

    await context.test('moderación: solo un admin ajeno, con motivo; el promedio público excluye la reseña oculta', async () => {
      const id = (await pool.query('SELECT id FROM resenas WHERE reserva_id=$1', [s.id])).rows[0].id;
      const moderar = (cookie: string, body: unknown) => pedir('/admin/resenas/' + id + '/moderacion', 'PATCH', body, cookie);
      assert.equal((await moderar(cliente, { oculta: true, motivo: 'Intento sin permisos.' })).status, 403);
      assert.equal((await moderar(administrador, { oculta: true, motivo: 'corto' })).status, 400);
      assert.equal((await moderar(administrador, { oculta: true, motivo: 'Contiene datos personales del proveedor.' })).status, 200);
      assert.deepEqual((await (await pedir('/resenas/resumen?proveedores=' + proveedorId)).json())[proveedorId], { total: 0, promedio: null });
      assert.equal((await (await pedir('/proveedores/' + proveedorId + '/resenas')).json()).total, 0);
      const lista = await (await pedir('/admin/resenas', 'GET', undefined, administrador)).json();
      const fila = lista.items.find((r: any) => r.id === id);
      assert.equal(fila.oculta, true); assert.equal(fila.ultimaModeracion.motivo, 'Contiene datos personales del proveedor.');
      assert.equal((await pedir('/admin/resenas', 'GET', undefined, cliente)).status, 403);
      assert.equal((await moderar(administrador, { oculta: false, motivo: 'Restablecida tras editar la revisión.' })).status, 200);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM resenas_moderaciones WHERE resena_id=$1', [id])).rows[0].n, 2);
    });
  } finally { await app.close(); await pool.end(); }
});
