import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { verificarRestauracion } from '../../scripts/restauracion';

const HORA = 3_600_000;
const png = () => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), randomBytes(64)]);

test('EQ-09: el verificador acepta una base íntegra y detecta clave distinta, archivo dañado y migración faltante', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-restauracion-pruebas-2026-09'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  process.env.DOCUMENTOS_KEY ||= randomBytes(32).toString('hex');
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  try {
    // Otras pruebas de la misma base cifran con su propia clave: solo cuentan los problemas nuevos.
    const previos = new Set((await verificarRestauracion(pool)).problemas);
    const nuevos = (r: { problemas: string[] }) => r.problemas.filter(p => !previos.has(p));
    const [cliente, proveedor] = [await login(h.clienteEmail), await login(h.proveedorEmail)];
    const paso = async (s: any, accion: string, cookie: string) => { const r = await pedir(`/reservas/${s.id}/${accion}`, 'POST', { versionActual: s.version }, cookie); assert.equal(r.status, 201, accion); return r.json(); };
    const desde = Date.now() + 200 * HORA;
    const creada = await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 }, cliente);
    assert.equal(creada.status, 201);
    const s = await paso(await paso(await paso(await creada.json(), 'aceptacion', proveedor), 'efectivo', proveedor), 'recepcion', cliente);
    const form = new FormData(); form.set('etapa', 'entrega'); form.append('fotos', new Blob([png()], { type: 'image/png' }), 'foto.png');
    assert.equal((await fetch(`${root}/reservas/${s.id}/evidencias`, { method: 'POST', headers: { Origin: process.env.APP_ORIGIN!, Cookie: cliente }, body: form })).status, 201);
    const evidencia = (await pool.query('SELECT id FROM evidencias WHERE reserva_id=$1', [s.id])).rows[0].id as string;
    // Un pago aprobado en el historial, como lo deja la pasarela.
    await pool.query(`INSERT INTO pagos_intentos(id, reserva_id, cliente_id, clave, huella, importe_centimos, estado, referencia, resuelto_en)
      SELECT $1,$2,cliente_id,$3,$4,4250,'APROBADO',$5,now() FROM reservas WHERE id=$2`, [randomUUID(), s.id, 'restauracion-' + randomUUID().slice(0, 8), randomBytes(32).toString('hex'), 'chr_test_' + randomUUID().slice(0, 8)]);

    const base = await verificarRestauracion(pool);
    await context.test('base íntegra: todo descifra, coincide con su hash y el pago está en el historial', () => {
      assert.deepEqual(nuevos(base), []);
      assert.equal(base.ok, previos.size === 0);
      assert.ok(base.archivos.evidencias.verificados >= 1);
      assert.equal(base.archivos.evidencias.verificados, base.archivos.evidencias.vigentes);
      assert.ok((base.pagos.porEstado.APROBADO ?? 0) >= 1);
      assert.match(base.huella, /^[a-f0-9]{64}$/);
    });

    await context.test('la verificación solo lee: repetirla da la misma huella', async () => {
      assert.equal((await verificarRestauracion(pool)).huella, base.huella);
    });

    await context.test('sin la clave original los archivos no se leen', async () => {
      const original = process.env.DOCUMENTOS_KEY;
      process.env.DOCUMENTOS_KEY = randomBytes(32).toString('hex');
      try {
        const r = await verificarRestauracion(pool);
        assert.equal(r.ok, false);
        assert.ok(r.problemas.some(p => p.includes(evidencia) && p.includes('no se pudo descifrar')));
      } finally { process.env.DOCUMENTOS_KEY = original; }
      delete process.env.DOCUMENTOS_KEY;
      try { assert.ok((await verificarRestauracion(pool)).problemas.some(p => p.startsWith('Falta DOCUMENTOS_KEY'))); }
      finally { process.env.DOCUMENTOS_KEY = original; }
    });

    await context.test('un archivo dañado, una migración faltante o un pago perdido cambian el resultado', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query("UPDATE evidencias SET contenido = set_byte(contenido, 0, (get_byte(contenido, 0) + 1) % 256) WHERE id=$1", [evidencia]);
        await client.query("DELETE FROM migraciones WHERE nombre='reservas/010-eventos-incidencias'");
        await client.query('DELETE FROM pagos_intentos WHERE reserva_id=$1', [s.id]);
        const r = await verificarRestauracion(client);
        assert.equal(r.ok, false);
        assert.ok(r.problemas.some(p => p.includes(evidencia)));
        assert.ok(r.problemas.includes('Falta la migración reservas/010-eventos-incidencias.'));
        assert.notEqual(r.huella, base.huella);
      } finally { await client.query('ROLLBACK'); client.release(); }
      assert.equal((await verificarRestauracion(pool)).huella, base.huella);
    });
  } finally { await app.close(); await pool.end(); }
});
