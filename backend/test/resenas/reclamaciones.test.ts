import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { anioLima, entradaHoja, entradaRespuesta, numeroHoja, titularConfigurado, venceEn } from '../../src/modules/resenas/dominio/reclamaciones';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { test } from '@jest/globals';
import { caso } from '../caso';

const base = {
  tipo: 'reclamo', nombre: 'Rosa Quispe Huamán', tipoDocumento: 'DNI', numeroDocumento: '45678912', domicilio: 'Jr. Lima 123, Ayacucho',
  telefono: '987 654 321', email: 'Rosa@Example.com', medioRespuesta: 'correo', bienTipo: 'servicio',
  bienDescripcion: 'Alquiler de taladro percutor, reserva del 10 de noviembre', montoCentimos: 3500,
  detalle: 'El taladro llegó sin la broca que figuraba en la publicación y no pude terminar el trabajo.', pedido: 'Que me devuelvan el monto del día.',
};

test('Libro de Reclamaciones: validación de la hoja', () => {
  const h = entradaHoja(base);
  assert.equal(h.email, 'rosa@example.com'); assert.equal(h.telefono, '987654321'); assert.equal(h.numeroDocumento, '45678912');
  assert.equal(h.menorDeEdad, false); assert.equal(h.apoderadoNombre, null);
  assert.equal(entradaHoja({ ...base, telefono: '' }).telefono, null);
  assert.equal(entradaHoja({ ...base, montoCentimos: null }).montoCentimos, null);
  assert.equal(entradaHoja({ ...base, tipoDocumento: 'CE', numeroDocumento: 'ab-1234567' }).numeroDocumento, 'AB1234567');
  assert.equal(entradaHoja({ ...base, detalle: 'Primera línea del reclamo.\nSegunda línea con detalle.' }).detalle, 'Primera línea del reclamo.\nSegunda línea con detalle.');
  const menor = entradaHoja({ ...base, menorDeEdad: true, apoderadoNombre: 'Juan Quispe', apoderadoDocumento: '41234567' });
  assert.equal(menor.apoderadoNombre, 'Juan Quispe');
  for (const malo of [
    { ...base, tipo: 'denuncia' }, { ...base, tipoDocumento: 'DNI', numeroDocumento: '1234567' }, { ...base, tipoDocumento: 'RUC', numeroDocumento: '30123456789' },
    { ...base, email: 'rosa@' }, { ...base, telefono: '812345678' }, { ...base, montoCentimos: -1 }, { ...base, montoCentimos: 10.5 },
    { ...base, detalle: 'corto' }, { ...base, pedido: '' }, { ...base, medioRespuesta: 'whatsapp' }, { ...base, bienTipo: 'otro' },
    { ...base, menorDeEdad: true }, { ...base, apoderadoNombre: 'Sin ser menor' }, { ...base, usuarioId: randomUUID() }, null, [],
  ]) assert.throws(() => entradaHoja(malo), (e: any) => e.status === 400, JSON.stringify(malo));
  assert.throws(() => entradaRespuesta({ respuesta: 'Muy corta', medio: 'correo' }));
  assert.throws(() => entradaRespuesta({ respuesta: 'Respuesta suficientemente larga para registrar.', medio: 'sms' }));
});

test('Libro de Reclamaciones: plazo de 15 días hábiles en hora de Lima', () => {
  // Viernes 13 de noviembre de 2026, 10:00 en Lima: cuenta desde el lunes 16 y vence el viernes 4 de diciembre.
  assert.equal(venceEn(new Date('2026-11-13T15:00:00Z')), '2026-12-04');
  // 22:00 del viernes en Lima ya es sábado en UTC, pero sigue siendo viernes para el plazo.
  assert.equal(venceEn(new Date('2026-11-14T03:00:00Z')), '2026-12-04');
  // Presentada un sábado: el plazo empieza el lunes.
  assert.equal(venceEn(new Date('2026-11-14T15:00:00Z')), '2026-12-04');
  assert.equal(venceEn(new Date('2026-11-16T15:00:00Z')), '2026-12-07');
  assert.equal(numeroHoja(2026, 7), 'LR-2026-000007');
  assert.equal(anioLima(new Date('2027-01-01T03:00:00Z')), 2026);
  assert.deepEqual(titularConfigurado({ QATU_TITULAR_RAZON_SOCIAL: ' Qatu ', QATU_TITULAR_RUC: '' }),
    { razonSocial: 'Qatu', ruc: null, direccion: null, correo: null, telefono: null });
});

(!process.env.TEST_DATABASE_URL ? test.skip : test)('Libro de Reclamaciones con PostgreSQL real', async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-reclamaciones-pruebas-2026'; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://127.0.0.1:3100';
  process.env.QATU_DESPACHO_EVENTOS = 'inactivo'; process.env.DOCUMENTOS_KEY ||= randomBytes(32).toString('hex');
  process.env.QATU_TITULAR_RAZON_SOCIAL = 'Qatu (prueba)'; process.env.QATU_TITULAR_RUC = '10456789123';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await pool.query("DELETE FROM limites_acceso WHERE clave LIKE '%reclamaciones%' OR clave = 'ip:127.0.0.1:login'");
  const usuarios = new PostgresUsuarios(pool), password = 'frase de prueba del libro', hash = await new ScryptPasswords().crear(password);
  const cliente = await usuarios.crear('reclamo-cliente-' + randomUUID() + '@example.com', 'Cliente reclamo', hash);
  const admin = await usuarios.crear('reclamo-admin-' + randomUUID() + '@example.com', 'Admin reclamos', hash);
  await pool.query("INSERT INTO roles_usuario(usuario_id, rol) VALUES ($1, 'admin')", [admin.id]);
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '') => fetch(root + ruta, { method, headers: { Origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  const dni = () => String(10_000_000 + Math.floor(Math.random() * 89_999_999));
  try {
    const [sesionCliente, sesionAdmin] = [await login(cliente.email), await login(admin.email)];
    let anonima: any;

    await caso('sin cuenta: constancia con número, plazo y titular; el libro no exige registrarse', async () => {
      assert.deepEqual(await (await pedir('/reclamaciones/titular')).json(), { razonSocial: 'Qatu (prueba)', ruc: '10456789123', direccion: null, correo: null, telefono: null });
      const r = await pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: dni() });
      assert.equal(r.status, 201); anonima = await r.json();
      assert.match(anonima.numero, /^LR-\d{4}-\d{6}$/); assert.match(anonima.codigoConsulta, /^[A-Za-z0-9_-]{12}$/);
      assert.equal(anonima.venceEn, venceEn(new Date(anonima.presentadaEn)));
      assert.equal(anonima.titular.razonSocial, 'Qatu (prueba)'); assert.equal(anonima.consumidor.email, 'rosa@example.com'); assert.equal(anonima.respuesta, null);
      assert.equal(anonima.id, undefined);
      const fila = (await pool.query('SELECT usuario_id, codigo_consulta_hash FROM reclamaciones_hojas WHERE numero=$1', [anonima.numero])).rows[0];
      assert.equal(fila.usuario_id, null); assert.notEqual(fila.codigo_consulta_hash, anonima.codigoConsulta);
      assert.equal((await pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: '123' })).status, 400);
      assert.equal((await fetch(root + '/reclamaciones', { method: 'POST', headers: { Origin: 'https://otro.example', 'Content-Type': 'application/json' }, body: JSON.stringify(base) })).status, 403);
    });

    await caso('con sesión la hoja queda vinculada a la cuenta', async () => {
      const r = await pedir('/reclamaciones', 'POST', { ...base, tipo: 'queja', numeroDocumento: dni() }, sesionCliente);
      assert.equal(r.status, 201); const h = await r.json();
      assert.equal((await pool.query('SELECT usuario_id FROM reclamaciones_hojas WHERE numero=$1', [h.numero])).rows[0].usuario_id, cliente.id);
    });

    await caso('presentaciones simultáneas reciben números correlativos sin saltos ni repetidos', async () => {
      const respuestas = await Promise.all(Array.from({ length: 6 }, () => pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: dni() })));
      assert.deepEqual(respuestas.map(r => r.status), Array(6).fill(201));
      const numeros = (await Promise.all(respuestas.map(r => r.json()))).map(h => Number(h.numero.slice(-6))).sort((a, b) => a - b);
      for (let i = 1; i < numeros.length; i++) assert.equal(numeros[i], numeros[i - 1] + 1);
    });

    await caso('consulta pública solo con número y código correctos', async () => {
      const consulta = (numero: string, codigo: string) => pedir(`/reclamaciones/consulta?numero=${encodeURIComponent(numero)}&codigo=${encodeURIComponent(codigo)}`);
      assert.equal((await consulta(anonima.numero, 'x')).status, 400);
      assert.equal((await consulta(anonima.numero, 'A'.repeat(12))).status, 404);
      const ok = await consulta(anonima.numero.toLowerCase(), anonima.codigoConsulta);
      assert.equal(ok.status, 200); const h = await ok.json();
      assert.equal(h.numero, anonima.numero); assert.equal(h.codigoConsulta, undefined); assert.equal(h.respuesta, null);
    });

    await caso('atención: solo administración; respuesta una sola vez y visible en la consulta', async () => {
      assert.equal((await pedir('/admin/reclamaciones')).status, 401);
      assert.equal((await pedir('/admin/reclamaciones', 'GET', undefined, sesionCliente)).status, 403);
      assert.equal((await pedir('/admin/reclamaciones?estado=otra', 'GET', undefined, sesionAdmin)).status, 400);
      const pendientes = await (await pedir('/admin/reclamaciones?estado=pendiente', 'GET', undefined, sesionAdmin)).json();
      const hoja = pendientes.items.find((h: any) => h.numero === anonima.numero);
      assert.ok(hoja); assert.equal(hoja.vencida, false);
      const responder = (body: unknown, cookie = sesionAdmin) => pedir(`/admin/reclamaciones/${hoja.id}/respuesta`, 'PATCH', body, cookie);
      assert.equal((await responder({ respuesta: 'Corta', medio: 'correo' })).status, 400);
      assert.equal((await responder({ respuesta: 'Respuesta del administrador con detalle suficiente.', medio: 'correo' }, sesionCliente)).status, 403);
      assert.equal((await pedir(`/admin/reclamaciones/${randomUUID()}/respuesta`, 'PATCH', { respuesta: 'Respuesta del administrador con detalle suficiente.', medio: 'correo' }, sesionAdmin)).status, 404);
      const texto = 'Lamentamos lo ocurrido. Coordinamos con el proveedor la devolución del monto del día.';
      const [x, y] = await Promise.all([responder({ respuesta: texto, medio: 'correo' }), responder({ respuesta: texto + ' Segunda respuesta.', medio: 'carta' })]);
      assert.deepEqual([x.status, y.status].sort(), [200, 409]);
      const fila = (await pool.query('SELECT respuesta, respondida_por FROM reclamaciones_hojas WHERE id=$1', [hoja.id])).rows[0];
      assert.equal(fila.respondida_por, admin.id);
      const consulta = await (await pedir(`/reclamaciones/consulta?numero=${anonima.numero}&codigo=${anonima.codigoConsulta}`)).json();
      assert.equal(consulta.respuesta.texto, fila.respuesta);
      const respondidas = await (await pedir('/admin/reclamaciones?estado=respondida', 'GET', undefined, sesionAdmin)).json();
      assert.ok(respondidas.items.some((h: any) => h.numero === anonima.numero));
    });

    await caso('cuota por documento: 3 hojas cada 15 minutos', async () => {
      const doc = dni();
      for (let i = 0; i < 3; i++) assert.equal((await pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: doc })).status, 201);
      assert.equal((await pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: doc })).status, 429);
      assert.equal((await pedir('/reclamaciones', 'POST', { ...base, numeroDocumento: dni() })).status, 201);
    });

    await caso('la base rechaza hojas incoherentes aunque se salte la aplicación', async () => {
      await assert.rejects(pool.query("UPDATE reclamaciones_hojas SET respuesta='Texto de respuesta sin fecha ni autor' WHERE numero=$1 AND respuesta IS NULL", [anonima.numero.replace(/\d{6}$/, m => String(Number(m) + 1).padStart(6, '0'))]).then(r => { if (!r.rowCount) throw new Error('sin fila'); }));
      await assert.rejects(pool.query("UPDATE reclamaciones_hojas SET menor_de_edad=true WHERE numero=$1", [anonima.numero]));
    });
  } finally {
    await app.close(); await pool.end();
  }
});
