import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { PostgresProveedores } from '../../src/modules/proveedores/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

test('solicitudes persistidas: privacidad, snapshot, bandejas, rechazo concurrente y outbox atómico', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-pruebas-reservas-2026-488';
  process.env.APP_ORIGIN = 'http://127.0.0.1:3100'; process.env.NODE_ENV = 'test';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool), proveedores = new PostgresProveedores(pool);
  const sufijo = randomUUID(), password = 'frase exclusiva solicitudes de prueba', hash = await new ScryptPasswords().crear(password);
  const titular = await usuarios.crear('reservas-proveedor-' + sufijo + '@example.com', 'Proveedor reservas', hash);
  const cliente = await usuarios.crear('reservas-cliente-' + sufijo + '@example.com', 'Cliente reservas', hash);
  const tercero = await usuarios.crearAdministrador('reservas-tercero-' + sufijo + '@example.com', 'Tercero reservas', hash, 'Verificar que administración no concede lectura indiscriminada');
  const perfil = await proveedores.crear(titular.id, { nombrePublico: 'Taller reservas ' + sufijo, descripcion: 'Herramientas y oficios para proyectos locales de mantenimiento.', zonaId: 'ayacucho', visiblePublicamente: true });
  await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=$1", [perfil.id]);
  await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
  const app = await crearApp(); await app.listen(0, '127.0.0.1'); const root = await app.getUrl() + '/api/v1';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = '', origin = process.env.APP_ORIGIN!) => fetch(root + ruta, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const login = async (email: string) => { const r = await pedir('/auth/login', 'POST', { email, password }); assert.equal(r.status, 200); return r.headers.get('set-cookie')!.split(';')[0]; };
  let oferta: any, servicio: any, solicitud: any;
  try {
    const proveedor = await login(titular.email), consumidor = await login(cliente.email), ajeno = await login(tercero.email);
    const datos = { tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', titulo: 'Taladro reservas ' + sufijo, descripcion: 'Herramienta para perforaciones precisas en mantenimiento y proyectos del hogar.', incluye: ['Equipo y accesorios'], condiciones: ['Coordinar retiro y devolución'], modalidadPrecio: 'fija', tarifaCentimos: 4250, unidad: 'día', activa: true, recursos: [{ identificador: 'Unidad A', activo: true }, { identificador: 'Unidad B', activo: false }] };
    const r = await pedir('/publicaciones', 'POST', datos, proveedor); assert.equal(r.status, 201); oferta = await r.json();
    const sr = await pedir('/publicaciones', 'POST', { ...datos, tipo: 'servicio', categoriaId: 'electricidad', modalidadPrecio: 'cotizacion', tarifaCentimos: null, unidad: null, recursos: [{ identificador: 'Agenda', activo: true }] }, proveedor); assert.equal(sr.status, 201); servicio = await sr.json();
    const inicio = new Date(Date.now() + 3 * 86400000).toISOString(), fin = new Date(Date.now() + 4 * 86400000).toISOString();
    const entrada = { publicacionId: oferta.id, recursoId: oferta.recursos.find((r: any) => r.activo).id, inicio, fin };

    await context.test('rechaza anónimos, suplantación, origen ajeno, recursos inactivos/ajenos y oferta propia', async () => {
      assert.equal((await pedir('/reservas', 'POST', entrada)).status, 401);
      assert.equal((await pedir('/reservas', 'POST', entrada, proveedor)).status, 403);
      assert.equal((await pedir('/reservas', 'POST', { ...entrada, clienteId: tercero.id }, consumidor)).status, 400);
      assert.equal((await pedir('/reservas', 'POST', { ...entrada, importe: 1 }, consumidor)).status, 400);
      assert.equal((await pedir('/reservas', 'POST', entrada, consumidor, 'https://ajeno.example')).status, 403);
      assert.equal((await pedir('/reservas', 'POST', { ...entrada, recursoId: oferta.recursos.find((r: any) => !r.activo).id }, consumidor)).status, 404);
      assert.equal((await pedir('/reservas', 'POST', { ...entrada, recursoId: servicio.recursos[0].id }, consumidor)).status, 404);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas WHERE publicacion_id=$1', [oferta.id])).rows[0].n, 0);
    });
    await context.test('crea pendiente y snapshot servidor sin confirmar dinero; duplicados concurrentes tienen un efecto', async () => {
      const respuestas = await Promise.all([pedir('/reservas', 'POST', entrada, consumidor), pedir('/reservas', 'POST', entrada, consumidor)]);
      assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]); solicitud = await respuestas.find(r => r.status === 201)!.json();
      assert.equal(solicitud.estado, 'PENDIENTE'); assert.equal(solicitud.version, 1); assert.equal(solicitud.participacion, 'cliente');
      assert.equal(solicitud.snapshot.tarifaReferenciaCentimos, 4250); assert.equal(Object.hasOwn(solicitud.snapshot, 'total'), false);
      for (const campo of ['clienteId', 'propietarioId', 'email']) assert.equal(Object.hasOwn(solicitud, campo), false);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1', [solicitud.id])).rows[0].n, 1);
      // Otra cuenta puede solicitar fechas superpuestas: PENDIENTE no es un bloqueo.
      assert.equal((await pedir('/reservas', 'POST', entrada, ajeno)).status, 201);
    });
    await context.test('bandejas propias sin fuga; administrador no participante obtiene 404; cliente no responde', async () => {
      const pagina = await (await pedir('/reservas', 'GET', undefined, consumidor)).json(); assert.equal(pagina.total, 1); assert.equal(pagina.limit, 20);
      const recibidas = await (await pedir('/reservas?vista=proveedor', 'GET', undefined, proveedor)).json(); assert.equal(recibidas.total, 2); assert.equal(recibidas.items[0].participacion, 'proveedor');
      assert.equal((await pedir('/reservas/' + solicitud.id, 'GET', undefined, ajeno)).status, 404);
      assert.equal((await pedir('/reservas/' + solicitud.id + '/rechazo', 'POST', { versionActual: 1, motivo: 'No disponible en esas fechas' }, consumidor)).status, 403);
      assert.equal((await pedir('/reservas?vista=cliente&clienteId=' + titular.id, 'GET', undefined, consumidor)).status, 400);
      const vacia = await (await pedir('/reservas?vista=proveedor', 'GET', undefined, consumidor)).json(); assert.equal(vacia.total, 0);
      const fuera = await (await pedir('/reservas?page=9999', 'GET', undefined, consumidor)).json(); assert.equal(fuera.total, 1); assert.equal(fuera.items.length, 0);
    });
    await context.test('oficio requiere descripción; tarifa histórica no cambia al editar la publicación', async () => {
      const entradaServicio = { ...entrada, publicacionId: servicio.id, recursoId: servicio.recursos[0].id };
      assert.equal((await pedir('/reservas', 'POST', entradaServicio, consumidor)).status, 400);
      assert.equal((await pedir('/reservas', 'POST', { ...entradaServicio, descripcionTrabajo: 'Necesito revisar y reparar dos tomacorrientes de mi vivienda.' }, consumidor)).status, 201);
      const cambio = await pedir('/publicaciones/' + oferta.id, 'PATCH', { ...datos, tarifaCentimos: 6000, recursos: oferta.recursos, versionActual: oferta.version }, proveedor);
      assert.equal(cambio.status, 200); oferta = await cambio.json();
      const historica = await (await pedir('/reservas/' + solicitud.id, 'GET', undefined, consumidor)).json(); assert.equal(historica.snapshot.tarifaReferenciaCentimos, 4250);
    });
    await context.test('si falla el outbox se revierten el rechazo y la versión', async () => {
      await pool.query("CREATE FUNCTION rechazar_outbox_005() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo='SOLICITUD_RECHAZADA' THEN RAISE EXCEPTION 'fallo de prueba'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER prueba_outbox_005 BEFORE INSERT ON reservas_outbox FOR EACH ROW EXECUTE FUNCTION rechazar_outbox_005()');
      try {
        const respuesta = await pedir('/reservas/' + solicitud.id + '/rechazo', 'POST', { versionActual: 1, motivo: 'Motivo sintético para probar la transacción.' }, proveedor);
        assert.equal(respuesta.status, 503);
        const leida = await (await pedir('/reservas/' + solicitud.id, 'GET', undefined, consumidor)).json();
        assert.equal(leida.estado, 'PENDIENTE'); assert.equal(leida.version, 1); assert.equal(leida.motivoRechazo, null);
        assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1', [solicitud.id])).rows[0].n, 1);
      } finally {
        await pool.query('DROP TRIGGER prueba_outbox_005 ON reservas_outbox');
        await pool.query('DROP FUNCTION rechazar_outbox_005()');
      }
    });
    await context.test('rechazo concurrente: una respuesta, versión y outbox; transición repetida no muta', async () => {
      const body = { versionActual: 1, motivo: 'La unidad no se puede coordinar en estas fechas.' };
      const respuestas = await Promise.all([pedir('/reservas/' + solicitud.id + '/rechazo', 'POST', body, proveedor), pedir('/reservas/' + solicitud.id + '/rechazo', 'POST', body, proveedor)]);
      assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
      const leida = await (await pedir('/reservas/' + solicitud.id, 'GET', undefined, consumidor)).json(); assert.equal(leida.estado, 'RECHAZADA'); assert.equal(leida.version, 2); assert.equal(leida.motivoRechazo, body.motivo);
      assert.equal((await pedir('/reservas/' + solicitud.id + '/rechazo', 'POST', { ...body, versionActual: 2 }, proveedor)).status, 409);
      const eventos = await pool.query('SELECT tipo,estado FROM reservas_outbox WHERE agregado_id=$1 ORDER BY creado_en', [solicitud.id]);
      assert.deepEqual(eventos.rows.map(e => e.tipo), ['SOLICITUD_CREADA', 'SOLICITUD_RECHAZADA']); assert.ok(eventos.rows.every(e => e.estado === 'PENDIENTE'));
    });
    await context.test('base rechaza intervalos inválidos y autocontratación; oferta oculta no recibe nuevas solicitudes', async () => {
      await assert.rejects(() => pool.query('UPDATE reservas SET fin=inicio WHERE id=$1', [solicitud.id]), (e: any) => e.code === '23514');
      await assert.rejects(() => pool.query('UPDATE reservas SET cliente_id=propietario_id WHERE id=$1', [solicitud.id]), (e: any) => e.code === '23514');
      const cambio = await pedir('/publicaciones/' + oferta.id, 'PATCH', { ...datos, activa: false, recursos: oferta.recursos, versionActual: oferta.version }, proveedor); assert.equal(cambio.status, 200);
      assert.equal((await pedir('/reservas', 'POST', { ...entrada, inicio: new Date(Date.parse(inicio) + 60000).toISOString() }, consumidor)).status, 404);
      // Historial sigue visible a sus participantes aunque se oculte la oferta.
      assert.equal((await pedir('/reservas/' + solicitud.id, 'GET', undefined, consumidor)).status, 200);
      await pool.query("UPDATE usuarios SET estado='inactivo' WHERE id=$1", [cliente.id]);
      assert.equal((await pedir('/reservas', 'GET', undefined, consumidor)).status, 401);
    });
  } finally { await app.close(); await pool.end(); }
});
