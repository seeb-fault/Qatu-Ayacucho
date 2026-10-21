import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { DocumentosPrivados } from '../../src/modules/proveedores/infraestructura/documentos';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=','base64');

test('documentos cifrados con autenticación, tipo y tamaño verificados', () => {
  process.env.DOCUMENTOS_KEY = randomBytes(32).toString('hex');
  const cifrado = new DocumentosPrivados();
  const documento = cifrado.cifrar({ buffer: png, mimetype: 'image/png', size: png.length });
  assert.notDeepEqual(Buffer.from(documento.contenido),png);
  assert.deepEqual(Buffer.from(cifrado.descifrar(documento)),png);
  assert.throws(() => cifrado.descifrar({ ...documento,tag: Buffer.alloc(16) }));
  assert.throws(() => cifrado.cifrar({ buffer: png,mimetype: 'application/pdf',size: png.length }));
});

test('carga, revisión y conservación documental privadas con PostgreSQL real', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'secreto-exclusivo-de-pruebas-documentales-488';
  process.env.APP_ORIGIN = 'http://127.0.0.1:3000';
  process.env.NODE_ENV = 'test';
  process.env.DOCUMENTOS_KEY = randomBytes(32).toString('hex');
  const clave = process.env.DOCUMENTOS_KEY;
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const usuarios = new PostgresUsuarios(pool);
  const sufijo = randomUUID();
  const password = 'frase segura para documentos privados';
  const hash = await new ScryptPasswords().crear(password);
  const usuario = await usuarios.crear(`documentos-${sufijo}@example.com`,'Cuenta documental',hash);
  const otro = await usuarios.crear(`otro-doc-${sufijo}@example.com`,'Otra cuenta documental',hash);
  const admin = await usuarios.crearAdministrador(`admin-doc-${sufijo}@example.com`,'Revisor documental',hash,'Preparación de pruebas documentales');
  await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
  const app = await crearApp();
  await app.listen(0,'127.0.0.1');
  const base = await app.getUrl();
  let cookie = '';
  let cookieAdmin = '';
  let cookieAjena = '';
  let perfilId = '';
  let solicitudId = '';
  let documentoId = '';
  const perfil = { nombrePublico: 'Taller documental', descripcion: 'Actividad de mantenimiento para proyectos de nuestra comunidad.', zonaId: 'ayacucho', visiblePublicamente: true };
  const pedir = (ruta: string,method = 'GET',body?: unknown,sesion = cookie) => fetch(`${base}/api/v1${ruta}`,{ method,headers: { Origin: process.env.APP_ORIGIN!,'Content-Type': 'application/json',Cookie: sesion },body: body === undefined ? undefined : JSON.stringify(body) });
  async function login(email: string) {
    const response = await pedir('/auth/login','POST',{ email,password },'');
    assert.equal(response.status,200);
    return response.headers.get('set-cookie')!.split(';')[0];
  }
  function subir(version: number, sesion = cookie, archivos = [{ contenido: png,tipo: 'image/png' }], consentimiento = 'true') {
    const form = new FormData();
    form.set('versionActual',String(version));
    form.set('aceptaConservacion',consentimiento);
    archivos.forEach(archivo => form.append('documentos',new Blob([archivo.contenido],{ type: archivo.tipo }),'documento-prueba.png'));
    return fetch(`${base}/api/v1/proveedores/me/verificaciones`,{ method: 'POST',headers: { Origin: process.env.APP_ORIGIN!,Cookie: sesion },body: form });
  }
  const resolver = (decision: string,motivo = 'Documentación revisada manualmente en el ensayo') => pedir(`/admin/proveedores/${perfilId}/verificacion`,'POST',{ solicitudId,decision,motivo },cookieAdmin);

  try {
    cookie = await login(usuario.email);
    cookieAdmin = await login(admin.email);
    cookieAjena = await login(otro.email);
    const creado = await pedir('/proveedores/me','POST',perfil);
    assert.equal(creado.status,201);
    perfilId = (await creado.json()).id;
    await context.test('exige sesión, configuración de cifrado, consentimiento y archivos válidos', async () => {
      assert.equal((await subir(1,'')).status,401);
      delete process.env.DOCUMENTOS_KEY;
      assert.equal((await subir(1)).status,503);
      process.env.DOCUMENTOS_KEY = clave;
      assert.equal((await subir(1,cookie,undefined,'false')).status,400);
      assert.equal((await subir(1,cookie,[])).status,400);
      assert.equal((await subir(1,cookie,[{ contenido: Buffer.from('<script>malicioso</script>'),tipo: 'image/png' }])).status,400);
      assert.equal((await subir(1,cookie,[{ contenido: png,tipo: 'application/pdf' }])).status,400);
      assert.equal((await subir(1,cookie,[{ contenido: Buffer.alloc(5242881),tipo: 'image/png' }])).status,413);
      assert.equal((await pool.query('SELECT count(*)::int AS total FROM verificaciones_proveedor WHERE proveedor_id=$1',[perfilId])).rows[0].total,0);
    });
    await context.test('solicitud y documentos se guardan juntos; solo hay una pendiente', async () => {
      const respuestas = await Promise.all([subir(1),subir(1)]);
      assert.deepEqual(respuestas.map(response => response.status).sort(),[201,409]);
      const solicitud = await respuestas.find(response => response.status === 201)!.json();
      solicitudId = solicitud.id;
      documentoId = solicitud.documentos[0].id;
      assert.equal(solicitud.estado,'pendiente');
      assert.equal(solicitud.perfilEnviado.nombrePublico,perfil.nombrePublico);
      assert.equal(solicitud.documentos[0].disponible,true);
      const guardado = await pool.query('SELECT contenido,iv,tag FROM documentos_proveedor WHERE id=$1',[documentoId]);
      assert.notDeepEqual(guardado.rows[0].contenido,png);
      assert.equal(guardado.rows[0].iv.length,12);
      assert.equal(guardado.rows[0].tag.length,16);
      const response = await pedir('/proveedores/me','PATCH',{ ...perfil,nombrePublico: 'Otro nombre',versionActual: 2 });
      assert.equal(response.status,409);
    });
    await context.test('descargas privadas y pública sin metadatos documentales', async () => {
      const ruta = `/proveedores/documentos/${documentoId}`;
      assert.equal((await pedir(ruta,'GET',undefined,'')).status,401);
      assert.equal((await pedir(ruta,'GET',undefined,cookieAjena)).status,404);
      for (const sesion of [cookie,cookieAdmin]) {
        const response = await pedir(ruta,'GET',undefined,sesion);
        assert.equal(response.status,200);
        assert.match(response.headers.get('content-disposition')!,/^attachment;/);
        assert.equal(response.headers.get('x-content-type-options'),'nosniff');
        assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
      }
      const publico = await (await pedir(`/proveedores/${perfilId}`,'GET',undefined,'')).json();
      assert.equal(publico.estadoVerificacion,'pendiente');
      assert.equal(JSON.stringify(publico).includes(documentoId),false);
      assert.deepEqual(Object.keys(publico).sort(),['descripcion','estadoVerificacion','id','nombrePublico','zona']);
      assert.equal((await pedir('/admin/proveedores/verificaciones','GET',undefined,cookieAjena)).status,403);
      assert.equal((await pedir(`/admin/proveedores/${perfilId}/verificacion`,'POST',{ solicitudId,decision: 'aprobada',motivo: 'Intento de autoaprobación' },cookie)).status,403);
    });
    await context.test('administrador no puede revisar su propio perfil', async () => {
      const propio = await pedir('/proveedores/me','POST',{ ...perfil,nombrePublico: 'Perfil del revisor' },cookieAdmin);
      const id = (await propio.json()).id;
      const enviada = await subir(1,cookieAdmin,[{ contenido: png,tipo: 'image/png' },{ contenido: png,tipo: 'image/png' }]);
      assert.equal(enviada.status,201);
      const solicitud = await enviada.json();
      assert.equal((await pedir(`/admin/proveedores/${id}/verificacion`,'POST',{ solicitudId: solicitud.id,decision: 'aprobada',motivo: 'Intento de resolver perfil propio' },cookieAdmin)).status,403);
    });
    await context.test('fallo de escritura revierte decisión y versión sin borrar documentos', async () => {
      await pool.query("CREATE FUNCTION rechazar_revision_003() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.motivo='simular fallo transaccional' THEN RAISE EXCEPTION 'fallo de prueba'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER prueba_revision_003 BEFORE UPDATE ON verificaciones_proveedor FOR EACH ROW EXECUTE FUNCTION rechazar_revision_003()');
      try {
        assert.equal((await resolver('aprobada','simular fallo transaccional')).status,503);
        const actual = await (await pedir('/proveedores/me')).json();
        assert.equal(actual.version,2);
        assert.equal(actual.estadoVerificacion,'pendiente');
        assert.equal((await (await pedir('/proveedores/me/verificaciones')).json())[0].estado,'pendiente');
      } finally {
        await pool.query('DROP TRIGGER prueba_revision_003 ON verificaciones_proveedor');
        await pool.query('DROP FUNCTION rechazar_revision_003()');
      }
    });
    await context.test('decisiones concurrentes guardan una sola resolución auditada', async () => {
      const respuestas = await Promise.all([resolver('aprobada'),resolver('rechazada')]);
      assert.deepEqual(respuestas.map(response => response.status).sort(),[201,409]);
      const resuelta = await respuestas.find(response => response.status === 201)!.json();
      assert.equal(resuelta.revisorId,admin.id);
      assert.ok(resuelta.revisadoEn);
      const publico = await (await pedir(`/proveedores/${perfilId}`,'GET',undefined,'')).json();
      assert.equal(publico.estadoVerificacion,resuelta.estado);
      const editar = await pedir('/proveedores/me','PATCH',{ ...perfil,nombrePublico: 'Nombre después de la revisión',versionActual: 3 });
      assert.equal(editar.status,200);
      assert.equal((await editar.json()).estadoVerificacion,'no_solicitada');
      const historial = await (await pedir('/proveedores/me/verificaciones')).json();
      assert.equal(historial[0].perfilEnviado.nombrePublico,perfil.nombrePublico);
    });
    await context.test('conservación mantiene activos, elimina adjuntos de inactivos y conserva decisiones', async () => {
      const nueva = await subir(4);
      assert.equal(nueva.status,201);
      const limpiar = () => execFileSync(process.execPath,['--import','tsx','scripts/limpiar-documentos.ts'],{ env: process.env,encoding: 'utf8' });
      assert.match(limpiar(),/Adjuntos eliminados de cuentas inactivas: 0/);
      const bloquear = await pedir(`/admin/usuarios/${usuario.id}/estado`,'PATCH',{ estadoActual: 'activo',estado: 'inactivo',motivo: 'Fin del periodo activo de la cuenta documental' },cookieAdmin);
      assert.equal(bloquear.status,200);
      assert.equal((await pedir(`/proveedores/documentos/${documentoId}`,'GET',undefined,cookieAdmin)).status,404);
      assert.match(limpiar(),/Adjuntos eliminados de cuentas inactivas: 2/);
      const restantes = await pool.query('SELECT count(*)::int AS total FROM documentos_proveedor d JOIN verificaciones_proveedor v ON v.id=d.verificacion_id WHERE v.proveedor_id=$1 AND d.contenido IS NOT NULL',[perfilId]);
      assert.equal(restantes.rows[0].total,0);
      const cuenta = await pool.query('SELECT count(*)::int AS total FROM verificaciones_proveedor WHERE proveedor_id=$1',[perfilId]);
      assert.equal(cuenta.rows[0].total,2);
      assert.equal((await pedir(`/admin/usuarios/${usuario.id}/estado`,'PATCH',{ estadoActual: 'inactivo',estado: 'activo',motivo: 'Cuenta reactivada para comprobar nueva documentación' },cookieAdmin)).status,200);
      cookie = await login(usuario.email);
      const propio = await (await pedir('/proveedores/me')).json();
      assert.equal(propio.estadoVerificacion,'no_solicitada');
      const historial = await (await pedir('/proveedores/me/verificaciones')).json();
      assert.ok(historial.every((solicitud: { documentos: { disponible: boolean }[] }) => solicitud.documentos.every(documento => !documento.disponible)));
      assert.equal(historial[0].estado,'cancelada');
      assert.equal((await pedir(`/proveedores/documentos/${documentoId}`)).status,404);
    });
  } finally {
    await app.close();
    await pool.end();
  }
});
