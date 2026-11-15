import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { contactoPermitido } from '../../src/modules/reservas/dominio/coordinacion';
import { whatsappValido } from '../../src/modules/usuarios/dominio/usuario';

const DIA = 86_400_000;

test('dominio: formato de WhatsApp de Perú y estados que comparten el contacto', () => {
  assert.equal(whatsappValido('987654321'), '+51987654321');
  assert.equal(whatsappValido('+51 987 654 321'), '+51987654321');
  assert.equal(whatsappValido('51-987-654-321'), '+51987654321');
  assert.equal(whatsappValido(''), null);
  for (const malo of ['887654321', '98765432', '+1 987654321', '9876543210', 'whatsapp', 12345]) assert.throws(() => whatsappValido(malo));
  assert.equal(contactoPermitido({ estado: 'PENDIENTE', cotizaciones: [] }), false);
  assert.equal(contactoPermitido({ estado: 'PENDIENTE', cotizaciones: [{} as never] }), true);
  for (const estado of ['VISITA_ACORDADA', 'ACEPTADA', 'EN_CURSO', 'SERVICIO_CONFIRMADO', 'SERVICIO_POR_PAGAR'] as const) assert.equal(contactoPermitido({ estado }), true, estado);
  for (const estado of ['RECHAZADA', 'CANCELADA', 'VENCIDA', 'DEVUELTA', 'SERVICIO_CERRADO'] as const) assert.equal(contactoPermitido({ estado }), false, estado);
});

test('WhatsApp con PostgreSQL real: consentimiento, participantes y momento de la operación', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-whatsapp-pruebas-2026-010'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.QATU_DESPACHO_EVENTOS = 'inactivo';
  const h = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts', '--servicio'], { encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } }));
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password: h.password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  try {
    const [cliente, proveedor, ajeno] = [await login(h.clienteEmail), await login(h.proveedorEmail), await login(h.clienteBEmail)];
    const desde = Date.now() + 5 * DIA;
    const s = await (await pedir('/reservas', 'POST', { publicacionId: h.publicacionId, recursoId: h.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 3_600_000).toISOString(),
      descripcionTrabajo: 'Revisar el tablero eléctrico y cambiar dos tomacorrientes de la cocina.' }, cliente)).json();

    await context.test('el perfil propio guarda el número y el consentimiento; un número inválido se rechaza', async () => {
      assert.equal((await pedir('/usuarios/me', 'PATCH', { nombre: 'Cliente E2E', whatsapp: '12345' }, cliente)).status, 400);
      assert.equal((await pedir('/usuarios/me', 'PATCH', { nombre: 'Cliente E2E', whatsapp: '912 345 678', whatsappVisible: 'si' }, cliente)).status, 400);
      const r = await (await pedir('/usuarios/me', 'PATCH', { nombre: 'Cliente E2E', whatsapp: '912 345 678', whatsappVisible: true }, cliente)).json();
      assert.equal(r.whatsapp, '+51912345678'); assert.equal(r.whatsappVisible, true);
      const yo = await (await pedir('/usuarios/me', 'GET', undefined, cliente)).json();
      assert.equal(yo.whatsapp, '+51912345678');
      // Al borrar el número se retira el consentimiento.
      const sin = await (await pedir('/usuarios/me', 'PATCH', { nombre: 'Cliente E2E', whatsapp: '' }, ajeno)).json();
      assert.equal(sin.whatsapp, null); assert.equal(sin.whatsappVisible, false);
    });

    await context.test('una solicitud pendiente sin respuesta no comparte números', async () => {
      assert.equal((await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, cliente)).status, 409);
      assert.equal((await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, proveedor)).status, 409);
    });

    await context.test('con la cotización enviada, cada parte ve el WhatsApp de la otra; un tercero no', async () => {
      const cot = await pedir('/reservas/' + s.id + '/cotizacion', 'POST', { versionActual: s.version, alcance: 'Revisar tablero y cambiar dos tomacorrientes.', materiales: 'Tomacorrientes incluidos.',
        importeCentimos: 12000, vigenteHasta: new Date(Date.now() + DIA).toISOString() }, proveedor);
      assert.equal(cot.status, 201);
      const paraCliente = await (await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, cliente)).json();
      assert.deepEqual([paraCliente.rol, paraCliente.whatsapp], ['proveedor', '+51987654321']);
      const paraProveedor = await (await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, proveedor)).json();
      assert.deepEqual([paraProveedor.rol, paraProveedor.whatsapp, paraProveedor.nombre], ['cliente', '+51912345678', 'Cliente E2E']);
      assert.equal((await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, ajeno)).status, 404);
      assert.equal((await pedir('/reservas/' + s.id + '/contacto')).status, 401);
    });

    await context.test('sin consentimiento el número no se entrega, aunque esté guardado', async () => {
      await pedir('/usuarios/me', 'PATCH', { nombre: 'Cliente E2E', whatsappVisible: false }, cliente);
      const r = await (await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, proveedor)).json();
      assert.equal(r.whatsapp, null);
    });

    await context.test('al cancelar, el contacto deja de compartirse', async () => {
      await pool.query("UPDATE reservas SET estado='CANCELADA' WHERE id=$1", [s.id]);
      assert.equal((await pedir('/reservas/' + s.id + '/contacto', 'GET', undefined, cliente)).status, 409);
    });
  } finally { await app.close(); await pool.end(); }
});
