import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { emailValido, entrada, nombreValido, passwordValido } from '../../src/modules/usuarios/dominio/usuario';

test('validación rechaza escalamiento de permisos y normaliza email', () => {
  assert.equal(emailValido('  CLIENTE@EXAMPLE.COM '), 'cliente@example.com');
  assert.throws(() => entrada({ nombre: 'Cliente', roles: ['admin'] }, ['nombre']));
  assert.throws(() => entrada(null, ['nombre']));
  assert.throws(() => nombreValido(' '));
  assert.throws(() => passwordValido('corta'));
  assert.throws(() => emailValido('invalido'));
});

test('hash salado y verificación scrypt', async () => {
  const passwords = new ScryptPasswords();
  const hash = await passwords.crear('frase de prueba segura');
  assert.notEqual(hash, await passwords.crear('frase de prueba segura'));
  assert.equal(await passwords.verificar('frase de prueba segura', hash), true);
  assert.equal(await passwords.verificar('otra frase de prueba', hash), false);
  assert.equal(await passwords.verificar('frase de prueba segura', 'invalido'), false);
});

test('HTTP y PostgreSQL: registro concurrente, permisos y sesiones', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-de-pruebas-integracion-488';
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await pool.query("DELETE FROM limites_acceso WHERE clave IN ('ip:127.0.0.1:registro', 'ip:127.0.0.1:login')");
  const app = await crearApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const sufijo = randomUUID();
  const email = `cliente-${sufijo}@example.com`;
  const password = 'una frase de prueba segura';
  let cookie = '';
  let usuarioId = '';
  const pedir = (ruta: string, method = 'GET', body?: unknown, sesion = cookie, origin = process.env.APP_ORIGIN!) => fetch(`${base}/api/v1${ruta}`, {
    method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: sesion },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    await context.test('rechaza acceso anónimo y origen ajeno', async () => {
      assert.equal((await pedir('/usuarios/me')).status, 401);
      assert.equal((await pedir('/auth/registro', 'POST', {}, '', 'https://otro.example')).status, 403);
    });
    await context.test('dos registros concurrentes generan una sola cuenta', async () => {
      const respuestas = await Promise.all([
        pedir('/auth/registro', 'POST', { email, password, nombre: 'Cliente Prueba' }),
        pedir('/auth/registro', 'POST', { email: ` ${email.toUpperCase()} `, password, nombre: 'Cliente Prueba' }),
      ]);
      assert.deepEqual(respuestas.map(res => res.status).sort(), [201, 409]);
      const response = respuestas.find(res => res.status === 201)!;
      const datos = await response.json();
      usuarioId = datos.usuario.id;
      assert.deepEqual(datos.usuario.roles, ['cliente']);
      assert.equal(datos.token, undefined);
      assert.equal(datos.usuario.passwordHash, undefined);
      const header = response.headers.get('set-cookie')!;
      assert.match(header, /HttpOnly/i);
      assert.match(header, /SameSite=Strict/i);
      assert.match(header, /Path=\/api\/v1/i);
      cookie = header.split(';')[0];
      const count = await pool.query('SELECT count(*)::int AS cantidad FROM usuarios WHERE email_normalizado=$1', [email]);
      assert.equal(count.rows[0].cantidad, 1);
    });
    await context.test('perfil propio, campos permitidos y varios roles', async () => {
      assert.equal((await pedir('/usuarios/me')).status, 200);
      for (const payload of [{ nombre: 'Intruso', id: randomUUID() }, { roles: ['admin'] }, { estado: 'inactivo' }, { passwordHash: 'x' }]) {
        assert.equal((await pedir('/usuarios/me', 'PATCH', payload)).status, 400);
      }
      const guardado = await pedir('/usuarios/me', 'PATCH', { nombre: 'Nuevo nombre' });
      assert.equal((await guardado.json()).nombre, 'Nuevo nombre');
      await pool.query("INSERT INTO roles_usuario(usuario_id,rol) VALUES ($1,'proveedor')", [usuarioId]);
      const response = await pedir('/usuarios/me');
      assert.deepEqual((await response.json()).roles, ['cliente', 'proveedor']);
      assert.equal((await pedir(`/usuarios/${randomUUID()}`, 'PATCH', { nombre: 'Intruso' })).status, 404);
      assert.equal((await pedir('/auth/registro', 'POST', { email: `admin-${email}`, password, nombre: 'Intruso', roles: ['admin'] })).status, 400);
    });
    await context.test('logout revoca la cookie aun si se vuelve a enviar', async () => {
      assert.equal((await pedir('/auth/logout', 'POST', {})).status, 204);
      assert.equal((await pedir('/usuarios/me')).status, 401);
      assert.equal((await pedir('/usuarios/me', 'PATCH', { nombre: 'Rechazado' })).status, 401);
    });
    await context.test('login y expiración persistida', async () => {
      assert.equal((await pedir('/auth/login', 'POST', { email, password: 'otra contraseña incorrecta' })).status, 401);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, 'qatu_sesion=invalido')).status, 401);
      const response = await pedir('/auth/login', 'POST', { email, password });
      assert.equal(response.status, 200);
      cookie = response.headers.get('set-cookie')!.split(';')[0];
      assert.equal((await pedir('/usuarios/me')).status, 200);
      await pool.query("UPDATE sesiones_usuario SET expira_en = now() - interval '1 second' WHERE usuario_id=$1", [usuarioId]);
      assert.equal((await pedir('/usuarios/me')).status, 401);
    });
    await context.test('cuenta inactiva invalida sesiones y oculta su estado en login', async () => {
      const response = await pedir('/auth/login', 'POST', { email, password });
      cookie = response.headers.get('set-cookie')!.split(';')[0];
      await pool.query("UPDATE usuarios SET estado='inactivo' WHERE id=$1", [usuarioId]);
      assert.equal((await pedir('/usuarios/me')).status, 401);
      const inactivo = await pedir('/auth/login', 'POST', { email, password });
      const inexistente = await pedir('/auth/login', 'POST', { email: `no-${email}`, password });
      assert.equal(inactivo.status, 401);
      assert.equal(inexistente.status, 401);
      assert.equal((await inactivo.json()).mensaje, (await inexistente.json()).mensaje);
    });
    await context.test('cuota persistente devuelve 429', async () => {
      const correo = `limite-${sufijo}@example.com`;
      for (let intento = 0; intento < 10; intento++) assert.equal((await pedir('/auth/login', 'POST', { email: correo, password })).status, 401);
      assert.equal((await pedir('/auth/login', 'POST', { email: correo, password })).status, 429);
    });
  } finally {
    await app.close();
    await pool.end();
  }
});
