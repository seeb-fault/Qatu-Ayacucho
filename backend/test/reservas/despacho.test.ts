import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { DespachadorEventos, MAX_INTENTOS, esperaReintento } from '../../src/modules/reservas/aplicacion/despacho';
import { NotificacionRechazada, type EventoReserva, type RepositorioDespacho } from '../../src/modules/reservas/dominio/puertos';
import { PostgresDespacho } from '../../src/modules/reservas/infraestructura/postgres-despacho';
import { crearNotificador } from '../../src/modules/reservas/reservas.module';

const HORA=3600000;
const evento=(intento=1):EventoReserva=>({id:'e',tipo:'SOLICITUD_CREADA',reservaId:'r',clienteId:'c',propietarioId:'p',payload:{},creadoEn:new Date(0).toISOString(),intento});
function repoDoble(eventos:EventoReserva[]) {
  const registro:{confirmados:string[];fallos:{codigo:string;espera:number|null}[]}={confirmados:[],fallos:[]};
  const repo:RepositorioDespacho={reclamar:async()=>eventos,confirmar:async id=>{registro.confirmados.push(id);},fallar:async(_id,_i,codigo,espera)=>{registro.fallos.push({codigo,espera});}};
  return {repo,registro};
}

test('la espera crece y tiene un máximo de una hora',()=>{
  assert.deepEqual([1,2,3,4].map(esperaReintento),[30000,60000,120000,240000]);
  assert.equal(esperaReintento(9),HORA);assert.equal(esperaReintento(500),HORA);
});

test('sin canal externo configurado el despacho no se activa ni afirma envíos',()=>{assert.equal(crearNotificador(),null);});

test('un canal colgado se corta por timeout y se reintenta',async()=>{
  const {repo,registro}=repoDoble([evento()]);
  const r=await new DespachadorEventos(repo,{enviar:()=>new Promise<void>(()=>{})},{limite:1,reclamoMs:1000,timeoutMs:10}).despachar();
  assert.deepEqual(r,{enviados:0,reintentos:1,fallidos:0});assert.deepEqual(registro.fallos,[{codigo:'TIMEOUT',espera:30000}]);
});

test('el rechazo definitivo no se reintenta y solo guarda un código sin datos',async()=>{
  const {repo,registro}=repoDoble([evento()]);
  assert.deepEqual(await new DespachadorEventos(repo,{enviar:async()=>{throw new NotificacionRechazada('DESTINO_INVALIDO');}}).despachar(),{enviados:0,reintentos:0,fallidos:1});
  assert.deepEqual(registro.fallos,[{codigo:'DESTINO_INVALIDO',espera:null}]);
  const otro=repoDoble([evento()]);
  await new DespachadorEventos(otro.repo,{enviar:async()=>{throw new NotificacionRechazada('falló para ana@example.com');}}).despachar();
  assert.equal(otro.registro.fallos[0].codigo,'RECHAZADA');
  const generico=repoDoble([evento()]);
  await new DespachadorEventos(generico.repo,{enviar:async()=>{throw new Error('falló para ana@example.com');}}).despachar();
  assert.equal(generico.registro.fallos[0].codigo,'ERROR_CANAL');
});

test('un fallo al registrar el resultado no interrumpe el resto del lote',async()=>{
  const {repo,registro}=repoDoble([{...evento(),id:'a'},{...evento(),id:'b'}]);
  repo.confirmar=async id=>{if(id==='a')throw new Error('base caída');registro.confirmados.push(id);};
  const original=console.error;console.error=()=>{};
  try {assert.deepEqual(await new DespachadorEventos(repo,{enviar:async()=>{}}).despachar(),{enviados:1,reintentos:0,fallidos:0});}
  finally {console.error=original;}
  assert.deepEqual(registro.confirmados,['b']);
});

test('despacho real: orden por reserva, reintentos, carrera, corte y canal caído',{skip:!process.env.TEST_DATABASE_URL},async context=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-despacho-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  // Base exclusiva de pruebas: los eventos de otras suites no deben entrar en estos lotes.
  await pool.query("UPDATE reservas_outbox SET estado='FALLIDO' WHERE estado='PENDIENTE'");
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,body:unknown,cookie='')=>fetch(root+ruta,{method:'POST',headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login',{email,password:f.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  const repo=new PostgresDespacho(pool),opciones={limite:20,reclamoMs:60000,timeoutMs:2000};
  let turno=0;
  try {
    const cliente=await login(f.clienteEmail),proveedor=await login(f.proveedorEmail);
    const solicitar=async()=>{
      const desde=Date.now()+(24+turno++)*HORA;
      const r=await pedir('/reservas',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+HORA).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},cliente);
      assert.equal(r.status,201);return r.json();
    };
    const rechazar=async(s:any)=>{const r=await pedir('/reservas/'+s.id+'/rechazo',{versionActual:s.version,motivo:'No hay disponibilidad para ese horario.'},proveedor);assert.equal(r.status,201);return r.json();};
    const filas=async(id:string)=>(await pool.query('SELECT id,tipo,estado,intentos,enviado_en,ultimo_error,proximo_intento FROM reservas_outbox WHERE agregado_id=$1 ORDER BY secuencia',[id])).rows;
    const vencerEspera=(id:string)=>pool.query("UPDATE reservas_outbox SET proximo_intento=clock_timestamp()-interval '1 second' WHERE agregado_id=$1 AND estado='PENDIENTE'",[id]);
    const receptor=()=>{const recibidos:EventoReserva[]=[];return {recibidos,enviar:async(e:EventoReserva)=>{recibidos.push(e);}};};

    await context.test('entrega el evento con sus participantes y lo marca enviado una sola vez',async()=>{
      const s=await solicitar(),c=receptor();
      assert.deepEqual(await new DespachadorEventos(repo,c,opciones).despachar(),{enviados:1,reintentos:0,fallidos:0});
      assert.equal(c.recibidos[0].reservaId,s.id);assert.equal(c.recibidos[0].tipo,'SOLICITUD_CREADA');assert.equal(c.recibidos[0].intento,1);
      assert.ok(c.recibidos[0].clienteId);assert.ok(c.recibidos[0].propietarioId);assert.notEqual(c.recibidos[0].clienteId,c.recibidos[0].propietarioId);
      const [fila]=await filas(s.id);assert.equal(fila.estado,'ENVIADO');assert.ok(fila.enviado_en);assert.equal(fila.ultimo_error,null);
      assert.deepEqual(await new DespachadorEventos(repo,c,opciones).despachar(),{enviados:0,reintentos:0,fallidos:0});assert.equal(c.recibidos.length,1);
    });

    await context.test('una reserva recibe sus eventos en orden, uno por lote',async()=>{
      const s=await solicitar();await rechazar(s);const c=receptor(),d=new DespachadorEventos(repo,c,opciones);
      await d.despachar();assert.deepEqual(c.recibidos.map(e=>e.tipo),['SOLICITUD_CREADA']);
      await d.despachar();assert.deepEqual(c.recibidos.map(e=>e.tipo),['SOLICITUD_CREADA','SOLICITUD_RECHAZADA']);
    });

    await context.test('con el canal caído se reintenta con espera, se conserva el orden y la reserva no cambia',async()=>{
      const s=await solicitar(),rechazada=await rechazar(s);
      const caido=new DespachadorEventos(repo,{enviar:async()=>{throw new Error('canal caído para ana@example.com');}},opciones);
      assert.deepEqual(await caido.despachar(),{enviados:0,reintentos:1,fallidos:0});
      let [primero,segundo]=await filas(s.id);
      assert.equal(primero.estado,'PENDIENTE');assert.equal(primero.intentos,1);assert.equal(primero.ultimo_error,'ERROR_CANAL');assert.ok(primero.proximo_intento.getTime()>Date.now()+20000);
      assert.equal(segundo.intentos,0);
      const c=receptor(),bien=new DespachadorEventos(repo,c,opciones);
      await bien.despachar();assert.equal(c.recibidos.length,0,'respeta la espera y no adelanta el evento siguiente');
      const reserva=(await pool.query('SELECT estado,version FROM reservas WHERE id=$1',[s.id])).rows[0];assert.equal(reserva.estado,'RECHAZADA');assert.equal(reserva.version,rechazada.version);
      await vencerEspera(s.id);await bien.despachar();await bien.despachar();
      assert.deepEqual(c.recibidos.map(e=>e.tipo),['SOLICITUD_CREADA','SOLICITUD_RECHAZADA']);assert.equal(c.recibidos[0].intento,2);
      [primero]=await filas(s.id);assert.equal(primero.estado,'ENVIADO');assert.equal(primero.ultimo_error,null);
    });

    await context.test('al agotar los intentos queda FALLIDO y no bloquea el evento siguiente',async()=>{
      const s=await solicitar();await rechazar(s);
      await pool.query('UPDATE reservas_outbox SET intentos=$2 WHERE agregado_id=$1 AND tipo=$3',[s.id,MAX_INTENTOS-1,'SOLICITUD_CREADA']);
      assert.deepEqual(await new DespachadorEventos(repo,{enviar:async()=>{throw new Error('caído');}},opciones).despachar(),{enviados:0,reintentos:0,fallidos:1});
      const [primero]=await filas(s.id);assert.equal(primero.estado,'FALLIDO');assert.equal(primero.intentos,MAX_INTENTOS);
      const c=receptor();await new DespachadorEventos(repo,c,opciones).despachar();assert.deepEqual(c.recibidos.map(e=>e.tipo),['SOLICITUD_RECHAZADA']);
    });

    await context.test('dos despachadores a la vez no entregan el mismo evento dos veces',async()=>{
      const ids:string[]=[];for(let i=0;i<12;i++)ids.push((await solicitar()).id);
      const recibidos:string[]=[],enviar=async(e:EventoReserva)=>{recibidos.push(e.id);await new Promise(r=>setTimeout(r,20));};
      const a=new DespachadorEventos(repo,{enviar},{...opciones,limite:5}),b=new DespachadorEventos(repo,{enviar},{...opciones,limite:5});
      for(let i=0;i<4;i++)await Promise.all([a.despachar(),b.despachar()]);
      assert.equal(recibidos.length,12);assert.equal(new Set(recibidos).size,12);
      assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=ANY($1::uuid[]) AND estado='ENVIADO'",[ids])).rows[0].n,12);
    });

    await context.test('tras un corte se reentrega el mismo id y un proceso atrasado no altera el resultado',async()=>{
      const s=await solicitar();
      const [reclamado]=await repo.reclamar(5,60000);assert.equal(reclamado.reservaId,s.id);assert.equal(reclamado.intento,1);
      const c=receptor(),d=new DespachadorEventos(repo,c,opciones);
      await d.despachar();assert.equal(c.recibidos.length,0,'sigue reclamado mientras no vence');
      await vencerEspera(s.id);await d.despachar();
      assert.equal(c.recibidos[0].id,reclamado.id,'mismo id para deduplicar');assert.equal(c.recibidos[0].intento,2);
      const antes=(await filas(s.id))[0];
      await repo.fallar(reclamado.id,1,'TIMEOUT',1000);
      const despues=(await filas(s.id))[0];assert.equal(despues.estado,'ENVIADO');assert.equal(despues.ultimo_error,null);assert.deepEqual(despues.enviado_en,antes.enviado_en);
      const t=await solicitar(),[viejo]=await repo.reclamar(5,60000);await vencerEspera(t.id);await repo.reclamar(5,60000);
      await repo.confirmar(viejo.id,1);assert.equal((await filas(t.id))[0].estado,'PENDIENTE');
      await repo.confirmar(viejo.id,2);assert.equal((await filas(t.id))[0].estado,'ENVIADO');
    });

    await context.test('PostgreSQL rechaza estados incoherentes y códigos que no son códigos',async()=>{
      const s=await solicitar();const [fila]=await filas(s.id);
      await assert.rejects(()=>pool.query("UPDATE reservas_outbox SET estado='ENVIADO' WHERE id=$1",[fila.id]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query("UPDATE reservas_outbox SET ultimo_error='falló para ana@example.com' WHERE id=$1",[fila.id]),(e:any)=>e.code==='23514');
    });
  } finally {await app.close();await pool.end();}
});
