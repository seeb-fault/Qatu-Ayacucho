import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { ConsultaProveedores } from '../../src/modules/proveedores';

test('perfiles de proveedores: propiedad, concurrencia y privacidad con PostgreSQL real', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-para-pruebas-proveedores-488';
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  process.env.NODE_ENV = 'test';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool);
  const password = 'frase segura para probar proveedores';
  const hash = await new ScryptPasswords().crear(password);
  const sufijo = randomUUID();
  const propietario = await usuarios.crear(`proveedor-${sufijo}@example.com`, 'Propietario de prueba', hash);
  const otro = await usuarios.crear(`otro-proveedor-${sufijo}@example.com`, 'Otro propietario', hash);
  await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
  const app = await crearApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  let cookie = '';
  let otraCookie = '';
  let perfilId = '';
  const datos = { nombrePublico: 'Taller de prueba', descripcion: 'Servicios de mantenimiento y herramientas para proyectos locales.', zonaId: 'ayacucho', visiblePublicamente: false };
  const pedir = (ruta: string, method = 'GET', body?: unknown, sesion = cookie, origin = process.env.APP_ORIGIN!) => fetch(`${base}/api/v1${ruta}`, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: sesion },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  async function login(email: string) {
    const response = await pedir('/auth/login', 'POST', { email, password }, '');
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie')!.split(';')[0];
  }

  try {
    await context.test('zonas públicas y rutas privadas rechazan anónimos', async () => {
      const zonas = await pedir('/proveedores/zonas', 'GET', undefined, '');
      assert.equal(zonas.status, 200);
      assert.equal((await zonas.json()).length, 4);
      assert.equal((await pedir('/proveedores/me')).status, 401);
      assert.equal((await pedir('/proveedores/me', 'POST', datos)).status, 401);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, versionActual: 1 })).status, 401);
    });
    cookie = await login(propietario.email);
    otraCookie = await login(otro.email);
    await context.test('sin perfil devuelve 404; dos altas simultáneas crean un solo perfil', async () => {
      assert.equal((await pedir('/proveedores/me')).status, 404);
      const respuestas = await Promise.all([pedir('/proveedores/me', 'POST', datos), pedir('/proveedores/me', 'POST', datos)]);
      assert.deepEqual(respuestas.map(response => response.status).sort(), [201, 409]);
      const perfil = await respuestas.find(response => response.status === 201)!.json();
      perfilId = perfil.id;
      assert.equal(perfil.usuarioId, propietario.id);
      assert.equal(perfil.version, 1);
      assert.equal(perfil.estadoVerificacion, 'no_solicitada');
      assert.equal(perfil.visiblePublicamente, false);
      assert.equal(perfil.zona.id, datos.zonaId);
      const conteo = await pool.query('SELECT count(*)::int AS total FROM proveedores WHERE usuario_id=$1', [propietario.id]);
      assert.equal(conteo.rows[0].total, 1);
      assert.deepEqual((await usuarios.porId(propietario.id))!.roles, ['cliente']);
    });
    await context.test('validación impide suplantación, autoaprobación y zonas ajenas al catálogo', async () => {
      for (const body of [
        { ...datos, usuarioId: propietario.id }, { ...datos, estadoVerificacion: 'aprobada' }, { ...datos, roles: ['proveedor'] },
        { ...datos, nombrePublico: ' ' }, { ...datos, nombrePublico: '😀' }, { ...datos, descripcion: '😀'.repeat(10) }, { ...datos, descripcion: 'muy corto' }, { ...datos, descripcion: 'x'.repeat(1501) },
        { ...datos, visiblePublicamente: 'true' }, { ...datos, zonaId: 'zona-inexistente' },
      ]) assert.equal((await pedir('/proveedores/me', 'POST', body, otraCookie)).status, 400);
      assert.equal((await pedir('/proveedores/me', 'GET', undefined, otraCookie)).status, 404);
      assert.equal((await pedir(`/proveedores/${perfilId}`, 'PATCH', { ...datos, versionActual: 1 }, otraCookie)).status, 404);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, versionActual: 1, id: perfilId }, otraCookie)).status, 400);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, versionActual: '1' })).status, 400);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, versionActual: 1 }, cookie, 'https://otro.example')).status, 403);
    });
    await context.test('visibilidad explícita y proyección pública sin identidad privada', async () => {
      assert.equal((await pedir(`/proveedores/${perfilId}`, 'GET', undefined, '')).status, 404);
      const update = await pedir('/proveedores/me', 'PATCH', { ...datos, visiblePublicamente: true, versionActual: 1 });
      assert.equal(update.status, 200);
      assert.equal((await update.json()).version, 2);
      const publico = await pedir(`/proveedores/${perfilId}`, 'GET', undefined, '');
      assert.equal(publico.status, 200);
      assert.equal(publico.headers.get('cache-control'), 'no-store');
      const perfil = await publico.json();
      assert.deepEqual(Object.keys(perfil).sort(), ['descripcion', 'estadoVerificacion', 'id', 'nombrePublico', 'zona']);
      assert.equal(JSON.stringify(perfil).includes(propietario.email), false);
      assert.deepEqual(await app.get(ConsultaProveedores).consultar(perfilId), perfil);
      assert.equal((await pedir(`/proveedores/${randomUUID()}`, 'GET', undefined, '')).status, 404);
      assert.equal((await pedir('/proveedores/incorrecto', 'GET', undefined, '')).status, 400);
    });
    await context.test('ediciones concurrentes usan versión y no sobrescriben cambios ajenos', async () => {
      const primero = { ...datos, visiblePublicamente: true, versionActual: 2, nombrePublico: 'Primer taller' };
      const segundo = { ...primero, nombrePublico: 'Segundo taller' };
      const respuestas = await Promise.all([pedir('/proveedores/me', 'PATCH', primero), pedir('/proveedores/me', 'PATCH', segundo)]);
      assert.deepEqual(respuestas.map(response => response.status).sort(), [200, 409]);
      const ganador = await respuestas.find(response => response.status === 200)!.json();
      const persistido = await (await pedir('/proveedores/me')).json();
      assert.equal(ganador.version, 3);
      assert.equal(persistido.nombrePublico, ganador.nombrePublico);
      assert.equal((await pedir('/proveedores/me', 'PATCH', primero)).status, 409);
      const propioAjeno = await pedir('/proveedores/me', 'POST', { ...datos, nombrePublico: 'Taller de otra cuenta' }, otraCookie);
      assert.equal(propioAjeno.status, 201);
      const perfilAjeno = await propioAjeno.json();
      assert.notEqual(perfilAjeno.id, perfilId);
      assert.equal(perfilAjeno.usuarioId, otro.id);
      assert.equal((await (await pedir('/proveedores/me')).json()).nombrePublico, ganador.nombrePublico);
    });
    await context.test('ocultar y desactivar cuenta impide acceso público y no permite autoaprobación', async () => {
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, visiblePublicamente: false, versionActual: 3 })).status, 200);
      assert.equal((await pedir(`/proveedores/${perfilId}`, 'GET', undefined, '')).status, 404);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, visiblePublicamente: true, versionActual: 4 })).status, 200);
      await pool.query("UPDATE usuarios SET estado='inactivo' WHERE id=$1", [propietario.id]);
      assert.equal((await pedir(`/proveedores/${perfilId}`, 'GET', undefined, '')).status, 404);
      assert.equal((await pedir('/proveedores/me')).status, 401);
      assert.equal((await pedir('/proveedores/me', 'PATCH', { ...datos, versionActual: 5 })).status, 401);
      assert.equal((await pedir('/proveedores/me/verificaciones', 'POST', {}, otraCookie)).status, 400);
      assert.equal((await pedir(`/admin/proveedores/${perfilId}/verificacion`, 'POST', { decision: 'aprobada' }, otraCookie)).status, 403);
      assert.equal((await pedir(`/proveedores/${perfilId}/documentos`, 'GET', undefined, '')).status, 404);
    });
  } finally {
    await app.close();
    await pool.end();
  }
});
