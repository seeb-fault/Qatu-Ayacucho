import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

test('administración HTTP y PostgreSQL con auditoría transaccional', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-de-pruebas-administracion-488';
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  process.env.NODE_ENV = 'test';
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const repo = new PostgresUsuarios(pool);
  const passwords = new ScryptPasswords();
  const password = 'frase de prueba de administracion';
  const hash = await passwords.crear(password);
  const sufijo = randomUUID();
  const emailAdmin = `admin-${sufijo}@example.com`;
  const cliente = await repo.crear(`cliente-${sufijo}@example.com`, 'Cliente administrado', hash);
  const proveedor = await repo.crear(`proveedor-${sufijo}@example.com`, 'Proveedor administrado', hash);
  await pool.query("INSERT INTO roles_usuario(usuario_id,rol) VALUES ($1,'proveedor')", [proveedor.id]);
  await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
  const variables = { ...process.env, QATU_ADMIN_EMAIL: emailAdmin, QATU_ADMIN_NOMBRE: 'Administrador de prueba', QATU_ADMIN_PASSWORD: password, QATU_ADMIN_MOTIVO: 'Aprovisionamiento de pruebas US3' };
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/aprovisionar-admin.ts'], { env: variables, stdio: 'pipe' });
  const admin = (await repo.credenciales(emailAdmin))!.usuario;
  const app = await crearApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  let cookieAdmin = '';
  let cookieCliente = '';
  let cookieProveedor = '';
  const motivo = 'Incumplimiento revisado por administración';
  const pedir = (ruta: string, method = 'GET', body?: unknown, cookie = cookieAdmin, origin = process.env.APP_ORIGIN!) => fetch(`${base}/api/v1${ruta}`, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  async function login(email: string) {
    const response = await pedir('/auth/login', 'POST', { email, password }, '');
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie')!.split(';')[0];
  }
  const cambio = { estadoActual: 'activo', estado: 'inactivo', motivo };

  try {
    cookieAdmin = await login(emailAdmin);
    cookieCliente = await login(cliente.email);
    cookieProveedor = await login(proveedor.email);
    await context.test('CLI crea y audita administrador nuevo; nunca promueve email existente', async () => {
      assert.deepEqual(admin.roles, ['admin', 'cliente']);
      const eventos = await repo.auditoria(admin.id, 1);
      assert.equal(eventos.total, 1);
      assert.equal(eventos.eventos[0].accion, 'crear_admin');
      assert.equal(eventos.eventos[0].actorId, null);
      const repetido = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/aprovisionar-admin.ts'], { env: { ...variables, QATU_ADMIN_EMAIL: cliente.email }, encoding: 'utf8' });
      assert.equal(repetido.status, 1);
      assert.deepEqual((await repo.porId(cliente.id))!.roles, ['cliente']);
      assert.equal((await repo.auditoria(cliente.id, 1)).total, 0);
    });
    await context.test('matriz anónimo/cliente/proveedor rechaza acceso sin filtrar datos', async () => {
      for (const [cookie, status] of [['', 401], [cookieCliente, 403], [cookieProveedor, 403]] as const) {
        assert.equal((await pedir('/admin/usuarios', 'GET', undefined, cookie)).status, status);
        assert.equal((await pedir(`/admin/usuarios/${cliente.id}/auditoria`, 'GET', undefined, cookie)).status, status);
        assert.equal((await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', cambio, cookie)).status, status);
      }
      assert.equal((await repo.porId(cliente.id))!.estado, 'activo');
      assert.equal((await repo.auditoria(cliente.id, 1)).total, 0);
    });
    await context.test('listado paginado, filtros literales y DTO sin credenciales', async () => {
      const prefijo = `pagina-${sufijo}-`;
      await pool.query(`INSERT INTO usuarios(id,email_normalizado,password_hash,nombre)
        SELECT gen_random_uuid(),$1 || serie || '@example.com',$2,$1 || serie FROM generate_series(1,23) serie`, [prefijo, hash]);
      const primero = await pedir(`/admin/usuarios?q=${prefijo}&estado=activo`);
      assert.equal(primero.status, 200);
      const pagina = await primero.json();
      assert.equal(pagina.total, 23);
      assert.equal(pagina.usuarios.length, 20);
      assert.equal(pagina.paginas, 2);
      for (const usuario of pagina.usuarios) assert.deepEqual(Object.keys(usuario).sort(), ['email', 'estado', 'id', 'nombre', 'roles']);
      const segundo = await pedir(`/admin/usuarios?q=${prefijo}&pagina=2`);
      assert.equal((await segundo.json()).usuarios.length, 3);
      const vacio = await pedir('/admin/usuarios?q=%25_%5C');
      assert.equal((await vacio.json()).total, 0);
      for (const query of ['pagina=0', 'pagina=1.5', 'estado=borrado', 'roles=admin', 'q=uno&q=dos', `q=${'x'.repeat(101)}`]) assert.equal((await pedir(`/admin/usuarios?${query}`)).status, 400);
    });
    await context.test('validación, cuentas admin protegidas y origen ajeno no mutan', async () => {
      assert.equal((await pedir(`/admin/usuarios/${admin.id}/estado`, 'PATCH', cambio)).status, 409);
      const otroAdmin = await repo.crearAdministrador(`otro-admin-${sufijo}@example.com`, 'Otro administrador', hash, 'Administrador adicional de prueba');
      assert.equal((await pedir(`/admin/usuarios/${otroAdmin.id}/estado`, 'PATCH', cambio)).status, 409);
      const cookieOtroAdmin = await login(otroAdmin.email);
      const protegidas = await Promise.all([
        pedir(`/admin/usuarios/${otroAdmin.id}/estado`, 'PATCH', cambio),
        pedir(`/admin/usuarios/${admin.id}/estado`, 'PATCH', cambio, cookieOtroAdmin),
      ]);
      assert.deepEqual(protegidas.map(response => response.status), [409, 409]);
      for (const body of [{ ...cambio, motivo: 'corto' }, { ...cambio, roles: ['admin'] }, { ...cambio, actorId: cliente.id }, { ...cambio, estado: 'activo' }, { estado: 'inactivo', motivo }]) {
        assert.equal((await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', body)).status, 400);
      }
      assert.equal((await pedir('/admin/usuarios/no-es-uuid/estado', 'PATCH', cambio)).status, 400);
      assert.equal((await pedir(`/admin/usuarios/${randomUUID()}/estado`, 'PATCH', cambio)).status, 404);
      assert.equal((await pedir(`/admin/usuarios/${randomUUID()}/auditoria`)).status, 404);
      assert.equal((await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', cambio, cookieAdmin, 'https://otro.example')).status, 403);
      assert.equal((await repo.auditoria(cliente.id, 1)).total, 0);
    });
    await context.test('cambios concurrentes generan una sola auditoría y revocan sesiones', async () => {
      const otraCookie = await login(cliente.email);
      const respuestas = await Promise.all([pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', cambio), pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', cambio)]);
      assert.deepEqual(respuestas.map(response => response.status).sort(), [200, 409]);
      const historial = await pedir(`/admin/usuarios/${cliente.id}/auditoria`);
      const datos = await historial.json();
      assert.equal(datos.total, 1);
      assert.equal(datos.eventos[0].actorId, admin.id);
      assert.equal(datos.eventos[0].estadoAnterior, 'activo');
      assert.equal(datos.eventos[0].estadoNuevo, 'inactivo');
      assert.equal(datos.eventos[0].motivo, motivo);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieCliente)).status, 401);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, otraCookie)).status, 401);
      const sesiones = await pool.query('SELECT bool_and(revocada) AS revocadas FROM sesiones_usuario WHERE usuario_id=$1', [cliente.id]);
      assert.equal(sesiones.rows[0].revocadas, true);
      assert.equal((await pedir('/auth/login', 'POST', { email: cliente.email, password }, '')).status, 401);
      const cuentaConcurrente = await repo.crear(`carrera-${sufijo}@example.com`, 'Cuenta concurrente', hash);
      const [ingreso, desactivacion] = await Promise.all([
        pedir('/auth/login', 'POST', { email: cuentaConcurrente.email, password }, ''),
        pedir(`/admin/usuarios/${cuentaConcurrente.id}/estado`, 'PATCH', cambio),
      ]);
      assert.equal(desactivacion.status, 200);
      assert.ok([200, 401].includes(ingreso.status));
      if (ingreso.status === 200) {
        const cookieConcurrente = ingreso.headers.get('set-cookie')!.split(';')[0];
        assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieConcurrente)).status, 401);
      }
      const residuales = await pool.query('SELECT count(*)::int AS total FROM sesiones_usuario WHERE usuario_id=$1 AND NOT revocada', [cuentaConcurrente.id]);
      assert.equal(residuales.rows[0].total, 0);
    });
    await context.test('reactivar exige nuevo login y no revive las cookies previas', async () => {
      const response = await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', { estadoActual: 'inactivo', estado: 'activo', motivo: 'Revisión completada y acceso restablecido' });
      assert.equal(response.status, 200);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieCliente)).status, 401);
      cookieCliente = await login(cliente.email);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieCliente)).status, 200);
      assert.equal((await repo.auditoria(cliente.id, 1)).total, 2);
    });
    await context.test('fallo de auditoría revierte estado, versión y revocación', async () => {
      const version = await pool.query('SELECT version FROM usuarios WHERE id=$1', [cliente.id]);
      await pool.query(`CREATE FUNCTION rechazar_auditoria_us3() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.motivo = 'simular fallo de auditoria' THEN RAISE EXCEPTION 'fallo de prueba'; END IF; RETURN NEW; END $$`);
      await pool.query('CREATE TRIGGER prueba_auditoria_us3 BEFORE INSERT ON auditoria_usuarios FOR EACH ROW EXECUTE FUNCTION rechazar_auditoria_us3()');
      try {
        const response = await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', { ...cambio, motivo: 'simular fallo de auditoria' });
        assert.equal(response.status, 503);
        assert.equal((await repo.porId(cliente.id))!.estado, 'activo');
        assert.equal((await repo.auditoria(cliente.id, 1)).total, 2);
        assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieCliente)).status, 200);
        const actual = await pool.query('SELECT version FROM usuarios WHERE id=$1', [cliente.id]);
        assert.equal(actual.rows[0].version, version.rows[0].version);
      } finally {
        await pool.query('DROP TRIGGER prueba_auditoria_us3 ON auditoria_usuarios');
        await pool.query('DROP FUNCTION rechazar_auditoria_us3()');
      }
    });
    await context.test('proveedor admite bloqueo de acceso; admin inactivo pierde autorización', async () => {
      assert.equal((await pedir(`/admin/usuarios/${proveedor.id}/estado`, 'PATCH', cambio)).status, 200);
      assert.equal((await pedir('/usuarios/me', 'GET', undefined, cookieProveedor)).status, 401);
      await assert.rejects(repo.crearSesion(randomUUID(), proveedor.id, new Date(Date.now() + 60000)), error => (error as { status: number }).status === 401);
      await pool.query("UPDATE usuarios SET estado='inactivo' WHERE id=$1", [admin.id]);
      await assert.rejects(repo.cambiarEstado(admin.id, cliente.id, 'activo', 'inactivo', motivo), error => (error as { status: number }).status === 403);
      await assert.rejects(repo.cambiarEstado(cliente.id, proveedor.id, 'inactivo', 'activo', motivo), error => (error as { status: number }).status === 403);
      assert.equal((await pedir('/admin/usuarios')).status, 401);
      assert.equal((await pedir(`/admin/usuarios/${cliente.id}/estado`, 'PATCH', cambio)).status, 401);
      assert.equal((await repo.porId(cliente.id))!.estado, 'activo');
    });
  } finally {
    await app.close();
    await pool.end();
  }
});
