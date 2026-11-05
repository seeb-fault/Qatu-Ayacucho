import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { DespachadorEventos } from '../../src/modules/reservas/aplicacion/despacho';
import { AVISOS, destinatarios } from '../../src/modules/reservas/dominio/avisos';
import type { EventoReserva } from '../../src/modules/reservas/dominio/puertos';
import { AvisosNotificador } from '../../src/modules/reservas/infraestructura/postgres-avisos';
import { PostgresDespacho } from '../../src/modules/reservas/infraestructura/postgres-despacho';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const HORA=3600000,evento=(tipo:string,actorId?:string):EventoReserva=>({id:'e',tipo,reservaId:'r',clienteId:'c',propietarioId:'p',payload:actorId?{actorId}:{},creadoEn:new Date(0).toISOString(),intento:1});

test('destinatarios: la acción avisa a la otra persona y nunca a quien la hizo',()=>{
  assert.deepEqual(destinatarios(evento('SOLICITUD_CREADA')),['p']);
  assert.deepEqual(destinatarios(evento('SOLICITUD_RECHAZADA','p')),['c']);
  assert.deepEqual(destinatarios(evento('RESERVA_CANCELADA','c')),['p']);
  assert.deepEqual(destinatarios(evento('RESERVA_CANCELADA','p')),['c']);
  assert.deepEqual(destinatarios(evento('RESERVA_VENCIDA')),['c','p']);
  assert.equal(destinatarios(evento('EVENTO_NUEVO')),null);
  for(const [tipo,aviso] of Object.entries(AVISOS)) if(aviso.para!=='ambos') for(const actor of ['c','p']) {
    const para=destinatarios(evento(tipo,actor))!;
    if(aviso.para==='otro') assert.ok(!para.includes(actor),tipo);
    assert.equal(para.length,1,tipo);
  }
});

test('avisos reales: bandeja propia, sin duplicados y lectura aislada',{skip:!process.env.TEST_DATABASE_URL},async context=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-avisos-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';process.env.QATU_DESPACHO_EVENTOS='inactivo';
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const otro=await new PostgresUsuarios(pool).crear('avisos-'+randomUUID()+'@example.com','Tercero',await new ScryptPasswords().crear(f.password));
  await pool.query("UPDATE reservas_outbox SET estado='FALLIDO' WHERE estado='PENDIENTE'");
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='')=>fetch(root+ruta,{method,headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password:f.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  const despachador=new DespachadorEventos(new PostgresDespacho(pool),new AvisosNotificador(pool));
  // Una vuelta por evento de cada reserva: se repite hasta vaciar la cola.
  const entregar=async()=>{for(let i=0;i<10;i++){const r=await despachador.despachar();assert.equal(r.fallidos+r.reintentos,0);if(!r.enviados)return;}};
  let turno=0;
  try {
    const cliente=await login(f.clienteEmail),proveedor=await login(f.proveedorEmail),tercero=await login(otro.email);
    const solicitar=async()=>{
      const desde=Date.now()+(24+turno++)*HORA;
      const r=await pedir('/reservas','POST',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+HORA).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},cliente);
      assert.equal(r.status,201);return r.json();
    };
    const bandeja=async(cookie:string,q='')=>{const r=await pedir('/avisos'+q,'GET',undefined,cookie);assert.equal(r.status,200);return r.json();};
    const resumen=async(cookie:string)=>(await (await pedir('/avisos/resumen','GET',undefined,cookie)).json()).noLeidos;

    await context.test('cada participante ve solo lo que le corresponde',async()=>{
      assert.equal((await pedir('/avisos')).status,401);assert.equal((await pedir('/avisos/resumen')).status,401);
      const s=await solicitar();await entregar();
      const p=await bandeja(proveedor);
      assert.equal(p.items.length,1);assert.equal(p.noLeidos,1);assert.equal(p.total,1);assert.equal(p.limit,20);
      assert.equal(p.items[0].reservaId,s.id);assert.equal(p.items[0].tipo,'SOLICITUD_CREADA');assert.equal(p.items[0].mensaje,'Recibiste una nueva solicitud.');assert.equal(p.items[0].titulo,f.titulo);assert.equal(p.items[0].vista,'proveedor');assert.equal(p.items[0].leidoEn,null);
      assert.deepEqual(Object.keys(p.items[0]).sort(),['creadoEn','id','leidoEn','mensaje','reservaId','tipo','titulo','vista'].sort());
      assert.equal((await bandeja(cliente)).total,0,'quien solicita no se avisa a sí mismo');assert.equal((await bandeja(tercero)).total,0);
      const r=await pedir('/reservas/'+s.id+'/rechazo','POST',{versionActual:s.version,motivo:'No hay disponibilidad para ese horario.'},proveedor);assert.equal(r.status,201);await entregar();
      const c=await bandeja(cliente);assert.equal(c.total,1);assert.equal(c.items[0].tipo,'SOLICITUD_RECHAZADA');assert.equal(c.items[0].vista,'cliente');
      assert.equal(await resumen(proveedor),1,'el rechazo no vuelve a avisar a quien rechazó');
    });

    await context.test('un evento reentregado no duplica el aviso',async()=>{
      const s=await solicitar(),antes=(await bandeja(proveedor)).total;
      const repo=new PostgresDespacho(pool),[reclamado]=await repo.reclamar(5,60000);assert.equal(reclamado.reservaId,s.id);
      const canal=new AvisosNotificador(pool);await canal.enviar(reclamado);await canal.enviar(reclamado);await canal.enviar({...reclamado,intento:2});
      await repo.confirmar(reclamado.id,reclamado.intento);
      assert.equal((await bandeja(proveedor)).total,antes+1);
    });

    await context.test('el vencimiento avisa a ambos y una cancelación solo a la otra persona',async()=>{
      const c0=(await bandeja(cliente)).total,p0=(await bandeja(proveedor)).total;
      const s=await solicitar();
      const r=await pedir('/reservas/'+s.id+'/cancelacion','POST',{versionActual:s.version,motivo:'Ya resolví el trabajo por otro medio.'},cliente);assert.equal(r.status,201);await entregar();
      const p=await bandeja(proveedor);assert.deepEqual(p.items.slice(0,2).map((a:any)=>a.tipo).sort(),['RESERVA_CANCELADA','SOLICITUD_CREADA']);assert.equal(p.total,p0+2);
      assert.equal((await bandeja(cliente)).total,c0);
      const v=await pool.query("INSERT INTO reservas_outbox(id,agregado_id,tipo,payload) VALUES($1,$2,'RESERVA_VENCIDA',$3) RETURNING id",[randomUUID(),s.id,JSON.stringify({reservaId:s.id,version:9})]);assert.equal(v.rowCount,1);await entregar();
      assert.equal((await bandeja(cliente)).total,c0+1);assert.equal((await bandeja(proveedor)).total,p0+3);
    });

    await context.test('la lectura es propia: otra persona recibe 404 y no cambia nada',async()=>{
      const p=await bandeja(proveedor),aviso=p.items[0],ruta='/avisos/'+aviso.id+'/lectura';
      assert.equal((await pedir(ruta,'POST',{})).status,401);
      assert.equal((await pedir(ruta,'POST',{},tercero)).status,404);assert.equal((await pedir(ruta,'POST',{},cliente)).status,404);
      assert.equal((await pedir('/avisos/no-uuid/lectura','POST',{},proveedor)).status,400);
      assert.equal((await pedir('/avisos/'+randomUUID()+'/lectura','POST',{},proveedor)).status,404);
      assert.equal((await pedir(ruta,'POST',{leidoEn:new Date(0).toISOString()},proveedor)).status,400);
      assert.equal((await bandeja(proveedor)).noLeidos,p.noLeidos);
      const r=await pedir(ruta,'POST',{},proveedor);assert.equal(r.status,201);assert.equal((await r.json()).noLeidos,p.noLeidos-1);
      const leido=(await bandeja(proveedor)).items.find((a:any)=>a.id===aviso.id);assert.ok(leido.leidoEn);
      assert.equal((await pedir(ruta,'POST',{},proveedor)).status,201);
      assert.equal((await bandeja(proveedor)).items.find((a:any)=>a.id===aviso.id).leidoEn,leido.leidoEn,'repetir conserva la primera lectura');
    });

    await context.test('marcar todo afecta solo a quien lo pide',async()=>{
      const c=await resumen(cliente);assert.ok(c>0);assert.ok(await resumen(proveedor)>0);
      assert.equal((await pedir('/avisos/lectura','POST',{})).status,401);assert.equal((await pedir('/avisos/lectura','POST',{todo:true},proveedor)).status,400);
      const r=await pedir('/avisos/lectura','POST',{},proveedor);assert.equal(r.status,201);assert.equal((await r.json()).noLeidos,0);
      assert.equal(await resumen(proveedor),0);assert.equal(await resumen(cliente),c);
    });

    await context.test('la bandeja pagina de 20 en 20 y rechaza consultas manipuladas',async()=>{
      for(let i=0;i<21;i++)await solicitar();await entregar();
      const uno=await bandeja(proveedor,'?page=1'),dos=await bandeja(proveedor,'?page=2');
      assert.equal(uno.items.length,20);assert.ok(dos.items.length>=1);assert.equal(new Set([...uno.items,...dos.items].map((a:any)=>a.id)).size,uno.items.length+dos.items.length);
      assert.equal((await pedir('/avisos?usuarioId='+randomUUID(),'GET',undefined,proveedor)).status,400);assert.equal((await pedir('/avisos?page=0','GET',undefined,proveedor)).status,400);
    });

    await context.test('todo tipo de evento permitido por PostgreSQL tiene un aviso definido',async()=>{
      const r=await pool.query("SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname='reservas_outbox_tipo_check'");
      const tipos=[...r.rows[0].d.matchAll(/'([A-Z_]+)'/g)].map((m:RegExpMatchArray)=>m[1]);
      assert.ok(tipos.length>=20);for(const tipo of tipos)assert.ok(AVISOS[tipo],'falta aviso para '+tipo);
    });
  } finally {await app.close();await pool.end();}
});
