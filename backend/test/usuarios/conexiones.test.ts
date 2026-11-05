import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { describirError } from '../../src/shared/infraestructura/base-datos';

test('los registros de error no copian mensajes de PostgreSQL, que pueden citar datos',()=>{
  const sql=Object.assign(new Error('duplicate key: ana@example.com'),{name:'error',code:'23505',constraint:'usuarios_email'});
  assert.equal(describirError(sql),'error 23505 usuarios_email');
  assert.equal(describirError(new Error('timeout exceeded when trying to connect')),'Error timeout exceeded when trying to connect');
  assert.equal(describirError(new Error('x'.repeat(500))).length,'Error '.length+120);
  assert.equal(describirError(null),'desconocido');
});

test('la API sobrevive y se recupera si PostgreSQL corta sus conexiones',{skip:!process.env.TEST_DATABASE_URL},async()=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-conexiones-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
  const original=console.error,registros:string[]=[];
  console.error=(...args:unknown[])=>{registros.push(args.join(' '));};
  try {
    assert.equal((await Promise.all(Array.from({length:12},()=>fetch(root+'/publicaciones')))).every(r=>r.status===200),true);
    await new Promise(r=>setTimeout(r,200));
    // Un manejador ausente haría terminar este mismo proceso de pruebas al cortar las conexiones.
    const r=await admin.query('SELECT count(pg_terminate_backend(pid))::integer AS n FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid()');
    assert.ok(r.rows[0].n>0,'debe haber conexiones que cortar');
    await new Promise(res=>setTimeout(res,500));
    assert.ok(registros.some(l=>l.includes('Se perdió una conexión inactiva con PostgreSQL')),'el corte queda registrado');
    assert.ok(registros.every(l=>!l.includes('postgresql://')),'sin cadenas de conexión');
    const respuestas=await Promise.all(Array.from({length:12},()=>fetch(root+'/publicaciones')));
    assert.deepEqual([...new Set(respuestas.map(x=>x.status))],[200]);
  } finally {console.error=original;await admin.end();await app.close();}
});
