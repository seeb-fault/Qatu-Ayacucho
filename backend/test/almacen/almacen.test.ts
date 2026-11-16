import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { AlmacenMemoria, AlmacenR2, ErrorAlmacen, claveObjeto, crearAlmacen } from '../../src/shared/infraestructura/almacen';
import { ArchivosExternos } from '../../src/shared/infraestructura/archivos-externos';
import { ArchivosCifrados } from '../../src/shared/infraestructura/archivos-cifrados';
import { PostgresEvidencias } from '../../src/modules/resenas/infraestructura/postgres-evidencias';
import { PostgresProveedores } from '../../src/modules/proveedores/infraestructura/postgres';
import { PostgresCatalogo } from '../../src/modules/catalogo/infraestructura/postgres';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { migrarArchivos } from '../../scripts/migrar-archivos';
import { verificarRestauracion } from '../../scripts/restauracion';

const ENDPOINT = 'https://' + 'a'.repeat(32) + '.r2.cloudflarestorage.com';
/** PNG sintético: firma válida y bytes aleatorios. */
const png = () => { const b = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), randomBytes(512)]); return { buffer: b, mimetype: 'image/png', size: b.length }; };

test('QATU_ALMACEN: PostgreSQL por defecto; R2 solo si se pide y con su configuración; memoria nunca en producción', () => {
  assert.equal(crearAlmacen({}), null);
  assert.equal(crearAlmacen({ QATU_ALMACEN: 'postgres', QATU_R2_ENDPOINT: ENDPOINT }), null);
  assert.equal(crearAlmacen({ QATU_ALMACEN: 'memoria' })?.nombre, 'memoria');
  assert.throws(() => crearAlmacen({ QATU_ALMACEN: 'memoria', NODE_ENV: 'production' }), /producción/);
  assert.throws(() => crearAlmacen({ QATU_ALMACEN: 's3' }), /QATU_ALMACEN/);
  const r2 = { QATU_ALMACEN: 'r2', QATU_R2_ENDPOINT: ENDPOINT, QATU_R2_ACCESS_KEY_ID: 'clave', QATU_R2_SECRET_ACCESS_KEY: 'secreto', QATU_R2_BUCKET_PRIVADO: 'qatu-privado-dev' };
  assert.equal(crearAlmacen(r2)?.nombre, 'r2');
  assert.throws(() => crearAlmacen({ ...r2, QATU_R2_ENDPOINT: 'http://otro.example' }), /QATU_R2_ENDPOINT/);
  assert.throws(() => crearAlmacen({ ...r2, QATU_R2_SECRET_ACCESS_KEY: '' }), /QATU_R2_SECRET_ACCESS_KEY/);
  assert.throws(() => crearAlmacen({ ...r2, QATU_R2_BUCKET_PRIVADO: 'Bucket_Mal' }), /bucket/);
  assert.equal(claveObjeto('resenas', 'evidencias', '6f1c2b6e-1f7a-4a54-9d2b-8c0b0f9a1e22'), 'resenas/evidencias/6f1c2b6e-1f7a-4a54-9d2b-8c0b0f9a1e22');
  assert.throws(() => claveObjeto('resenas', 'evidencias', '../../otro'), ErrorAlmacen);
});

test('AlmacenR2: firma S3 (SigV4, región auto) y códigos HTTP', async () => {
  const llamadas: { url: string; init: RequestInit }[] = [];
  let respuesta = new Response(null, { status: 200 });
  const falsa = (async (url: URL, init: RequestInit) => { llamadas.push({ url: String(url), init }); return respuesta.clone(); }) as unknown as typeof fetch;
  const r2 = new AlmacenR2(ENDPOINT + '/', 'CLAVE', 'SECRETO', 'qatu-privado-dev', falsa, () => new Date('2026-11-16T12:34:56.789Z'));
  const clave = claveObjeto('resenas', 'evidencias', randomUUID()), datos = Buffer.from('contenido cifrado');
  await r2.guardar(clave, datos);
  const { url, init } = llamadas[0], h = init.headers as Record<string, string>;
  assert.equal(url, `${ENDPOINT}/qatu-privado-dev/${clave}`);
  assert.equal(init.method, 'PUT');
  assert.equal(h['x-amz-date'], '20261116T123456Z');
  assert.equal(h['x-amz-content-sha256'], createHash('sha256').update(datos).digest('hex'));
  assert.match(h.authorization, /^AWS4-HMAC-SHA256 Credential=CLAVE\/20261116\/auto\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(h).includes('SECRETO'), 'el secreto nunca viaja');
  // La misma petición con otro secreto produce otra firma.
  const otra = new AlmacenR2(ENDPOINT, 'CLAVE', 'OTRO', 'qatu-privado-dev', falsa, () => new Date('2026-11-16T12:34:56.789Z'));
  assert.notEqual(otra.firmar('PUT', new URL(url), datos).authorization, h.authorization);

  respuesta = new Response(null, { status: 404 }); assert.equal(await r2.leer(clave), null); await r2.borrar(clave);
  respuesta = new Response('x', { status: 403 }); await assert.rejects(r2.leer(clave), /403/); await assert.rejects(r2.guardar(clave, datos), /403/);
  respuesta = new Response(null, { status: 204 }); await r2.borrar(clave);
  const caida = new AlmacenR2(ENDPOINT, 'C', 'S', 'b-1', (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch);
  await assert.rejects(caida.leer(clave), (e: unknown) => e instanceof ErrorAlmacen && /conectar/.test((e as Error).message));
});

test('AlmacenR2 contra Cloudflare R2 real', { skip: process.env.QATU_R2_PRUEBAS !== '1' && 'solo con QATU_R2_PRUEBAS=1 y las variables QATU_R2_*' }, async () => {
  const v = (k: string) => process.env[k]!.trim();
  const r2 = new AlmacenR2(v('QATU_R2_ENDPOINT'), v('QATU_R2_ACCESS_KEY_ID'), v('QATU_R2_SECRET_ACCESS_KEY'), v('QATU_R2_BUCKET_PRIVADO'));
  const clave = claveObjeto('resenas', 'evidencias', randomUUID()), datos = randomBytes(4096);
  try {
    await r2.guardar(clave, datos);
    assert.ok((await r2.leer(clave))!.equals(datos));
  } finally { await r2.borrar(clave); }
  assert.equal(await r2.leer(clave), null);
});

test('archivos en el almacén externo con PostgreSQL real', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DOCUMENTOS_KEY ||= randomBytes(32).toString('hex');
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const memoria = new AlmacenMemoria(), archivos = new ArchivosExternos(pool, memoria), cifrado = new ArchivosCifrados();
  const evidencias = new PostgresEvidencias(pool, archivos), enBase = new PostgresEvidencias(pool);
  const enCola = async (objeto: string) => (await pool.query('SELECT intentos, ultimo_error FROM objetos_por_borrar WHERE objeto=$1', [objeto])).rows[0];
  try {
    // Datos mínimos: un proveedor con una oferta y un cliente con una reserva.
    const sufijo = randomUUID(), usuarios = new PostgresUsuarios(pool), proveedores = new PostgresProveedores(pool, archivos);
    const dueno = await usuarios.crear(`almacen-p-${sufijo}@example.com`, 'Proveedor almacén', 'x'), cliente = await usuarios.crear(`almacen-c-${sufijo}@example.com`, 'Cliente almacén', 'x');
    const perfil = await proveedores.crear(dueno.id, { nombrePublico: 'Almacén ' + sufijo.slice(0, 8), descripcion: 'Proveedor sintético para las pruebas del almacén externo.', zonaId: 'ayacucho', visiblePublicamente: true });
    const oferta = await new PostgresCatalogo(pool).crear(perfil.id, { tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', titulo: 'Taladro almacén ' + sufijo.slice(0, 8),
      descripcion: 'Oferta sintética para las pruebas del almacén externo.', incluye: ['Equipo'], condiciones: ['Coordinar'], modalidadPrecio: 'fija', tarifaCentimos: 1000, unidad: 'día', activa: true, recursos: [{ identificador: 'Unidad', activo: true }] });
    const reservaId = randomUUID();
    await pool.query(`INSERT INTO reservas (id,cliente_id,propietario_id,proveedor_id,publicacion_id,recurso_id,inicio,fin,descripcion_trabajo,snapshot)
      VALUES ($1,$2,$3,$4,$5,$6,now()+interval '30 days',now()+interval '31 days','',$7::jsonb)`, [reservaId, cliente.id, dueno.id, perfil.id, oferta.id, oferta.recursos[0].id, JSON.stringify({ titulo: oferta.titulo })]);

    let guardada: { id: string; sha256: string };
    await context.test('evidencia: la fila guarda solo la clave; el almacén, los mismos bytes cifrados', async () => {
      const a = cifrado.cifrar(png(), ['image/png']);
      [guardada] = await evidencias.guardar(reservaId, cliente.id, 'entrega', [a]);
      const fila = (await pool.query('SELECT contenido, objeto FROM evidencias WHERE id=$1', [a.id])).rows[0];
      assert.equal(fila.contenido, null); assert.equal(fila.objeto, `resenas/evidencias/${a.id}`);
      assert.ok(AlmacenMemoria.objetos.get(fila.objeto)!.equals(Buffer.from(a.contenido)));
      const leida = (await evidencias.archivo(a.id))!;
      assert.equal(createHash('sha256').update(cifrado.descifrar({ id: a.id, contenido: leida.contenido!, iv: leida.iv!, tag: leida.tag! })).digest('hex'), a.sha256);
    });

    await context.test('si el almacén falla al subir, no se registra nada', async () => {
      const a = cifrado.cifrar(png(), ['image/png']);
      AlmacenMemoria.fallar = op => op === 'guardar';
      try { await assert.rejects(evidencias.guardar(reservaId, cliente.id, 'entrega', [a]), ErrorAlmacen); } finally { AlmacenMemoria.fallar = null; }
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM evidencias WHERE id=$1', [a.id])).rows[0].n, 0);
    });

    await context.test('si la transacción falla después de subir, los objetos se borran del almacén', async () => {
      const lote = Array.from({ length: 4 }, () => cifrado.cifrar(png(), ['image/png'])); // ya hay 1 en «entrega»: 5 superan el cupo de 4
      await assert.rejects(evidencias.guardar(reservaId, cliente.id, 'entrega', lote), (e: any) => e.status === 409);
      await archivos.procesarCola();
      for (const a of lote) assert.equal(AlmacenMemoria.objetos.has(`resenas/evidencias/${a.id}`), false);
      for (const a of lote) assert.equal(await enCola(`resenas/evidencias/${a.id}`), undefined);
    });

    await context.test('retención: borrar encola el objeto en la misma operación; un fallo se reintenta', async () => {
      const objeto = `resenas/evidencias/${guardada.id}`;
      AlmacenMemoria.fallar = op => op === 'borrar';
      try {
        assert.equal(await evidencias.borrarContenido([reservaId]), 1);
        await archivos.procesarCola();
      } finally { AlmacenMemoria.fallar = null; }
      const fila = (await pool.query('SELECT contenido, objeto, iv, eliminada_en FROM evidencias WHERE id=$1', [guardada.id])).rows[0];
      assert.equal(fila.objeto, null); assert.equal(fila.iv, null); assert.ok(fila.eliminada_en);
      const pendiente = await enCola(objeto);
      assert.ok(pendiente.intentos >= 1); assert.match(pendiente.ultimo_error, /simulado/);
      assert.ok(AlmacenMemoria.objetos.has(objeto), 'sigue en el almacén hasta el reintento');
      await archivos.procesarCola();
      assert.equal(AlmacenMemoria.objetos.has(objeto), false); assert.equal(await enCola(objeto), undefined);
      assert.equal((await evidencias.archivo(guardada.id))!.contenido, null);
    });

    await context.test('documentos de proveedor: suben al almacén, se leen y se purgan por la cola', async () => {
      const doc = cifrado.cifrar(png(), ['image/png']);
      const v = await proveedores.solicitar(perfil.id, perfil.version, [doc]);
      assert.equal(v.documentos[0].disponible, true);
      const fila = (await pool.query('SELECT contenido, objeto FROM documentos_proveedor WHERE id=$1', [doc.id])).rows[0];
      assert.equal(fila.contenido, null); assert.equal(fila.objeto, `proveedores/documentos/${doc.id}`);
      const leido = (await proveedores.documento(doc.id))!;
      assert.ok(Buffer.from(leido.contenido).equals(Buffer.from(doc.contenido)));
      assert.equal(await proveedores.purgarDocumentos(perfil.id), 1);
      await archivos.procesarCola();
      assert.equal(AlmacenMemoria.objetos.has(fila.objeto), false);
      assert.equal(await proveedores.documento(doc.id), null);
    });

    await context.test('la base rechaza un archivo vigente con contenido y objeto a la vez, o sin ninguno', async () => {
      const a = cifrado.cifrar(png(), ['image/png']);
      const insertar = (contenido: Buffer | null, objeto: string | null) => pool.query(`INSERT INTO evidencias(id,reserva_id,autor_id,etapa,tipo,bytes,sha256,contenido,iv,tag,objeto)
        VALUES($1,$2,$3,'devolucion','image/png',$4,$5,$6,$7,$8,$9)`, [a.id, reservaId, cliente.id, a.bytes, a.sha256, contenido, Buffer.from(a.iv), Buffer.from(a.tag), objeto]);
      await assert.rejects(insertar(Buffer.from(a.contenido), `resenas/evidencias/${a.id}`), /evidencias_contenido_u_objeto/);
      await assert.rejects(insertar(null, null), /evidencias_contenido_u_objeto/);
    });

    await context.test('mover a R2 los archivos que ya estaban en PostgreSQL, y verificarlos al restaurar', async () => {
      const a = cifrado.cifrar(png(), ['image/png']);
      await enBase.guardar(reservaId, dueno.id, 'devolucion', [a]);
      assert.ok((await pool.query('SELECT contenido FROM evidencias WHERE id=$1', [a.id])).rows[0].contenido);
      assert.ok((await migrarArchivos(pool, memoria, { simular: true })).pendientes.evidencias >= 1);
      assert.ok((await pool.query('SELECT contenido FROM evidencias WHERE id=$1', [a.id])).rows[0].contenido, 'simular no cambia nada');
      const r = await migrarArchivos(pool, memoria);
      assert.deepEqual(r.errores, []); assert.equal(r.pendientes.evidencias, 0); assert.ok(r.movidos.evidencias >= 1);
      const fila = (await pool.query('SELECT contenido, objeto FROM evidencias WHERE id=$1', [a.id])).rows[0];
      assert.equal(fila.contenido, null); assert.ok(AlmacenMemoria.objetos.get(fila.objeto)!.equals(Buffer.from(a.contenido)));
      assert.equal((await migrarArchivos(pool, memoria)).movidos.evidencias, 0, 'repetirlo no hace nada');

      const ok = await verificarRestauracion(pool, cifrado, memoria);
      assert.ok(!ok.problemas.some(p => p.includes(a.id)));
      AlmacenMemoria.objetos.delete(fila.objeto);
      const mal = await verificarRestauracion(pool, cifrado, memoria);
      assert.ok(mal.problemas.some(p => p.includes(a.id) && p.includes('falta en el almacén externo')));
      const sinAlmacen = await verificarRestauracion(pool, cifrado, null);
      assert.ok(sinAlmacen.problemas.some(p => p.includes(a.id) && p.includes('QATU_ALMACEN')));
      AlmacenMemoria.objetos.set(fila.objeto, Buffer.from(a.contenido));
    });
  } finally {
    AlmacenMemoria.fallar = null;
    // El almacén en memoria muere con este proceso: los archivos vuelven a PostgreSQL para no dejar filas
    // apuntando a objetos inexistentes en la base que comparten las demás pruebas.
    for (const tabla of ['evidencias', 'documentos_proveedor']) {
      for (const f of (await pool.query(`SELECT id, objeto FROM ${tabla} WHERE objeto IS NOT NULL`)).rows) {
        const datos = AlmacenMemoria.objetos.get(f.objeto);
        if (datos) await pool.query(`UPDATE ${tabla} SET contenido=$2, objeto=NULL WHERE id=$1`, [f.id, datos]);
      }
    }
    await pool.end();
  }
});
