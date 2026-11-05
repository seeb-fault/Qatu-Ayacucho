import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';
import { entradaCotizacion, entradaRespuestaCotizacion } from '../../src/modules/reservas/dominio/cotizacion';

test('cotización: dinero entero, vigencia UTC y respuesta sin importes manipulados', () => {
  const ahora=Date.now(), propuesta={versionActual:1,alcance:'Instalación de cuatro luminarias en el domicilio.',materiales:'Solo mano de obra, materiales del cliente.',importeCentimos:18000,vigenteHasta:new Date(ahora+60000).toISOString()};
  for (const importeCentimos of [0,-1,1.5,NaN,Infinity,100000000,'18000']) assert.throws(()=>entradaCotizacion({...propuesta,importeCentimos},ahora));
  assert.throws(()=>entradaCotizacion({...propuesta,vigenteHasta:new Date(ahora).toISOString()},ahora));
  assert.throws(()=>entradaCotizacion({...propuesta,clienteId:'ajeno'},ahora));
  assert.throws(()=>entradaRespuestaCotizacion({versionActual:2,versionCotizacion:1,importeCentimos:1},'ACEPTADA'));
  assert.throws(()=>entradaRespuestaCotizacion({versionActual:2,versionCotizacion:1,motivo:''},'RECHAZADA'));
});

test('cotizaciones reales: versiones, privacidad, carrera de aceptación, inmutabilidad y outbox', {skip:!process.env.TEST_DATABASE_URL}, async context => {
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-cotizaciones-pruebas-2026-488';
  process.env.APP_ORIGIN='http://127.0.0.1:3100';process.env.NODE_ENV='test';
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='')=>fetch(root+ruta,{method,headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password:f.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  try {
    const tercero=await new PostgresUsuarios(pool).crear('cotizacion-tercero-'+randomUUID()+'@example.com','Tercero',await new ScryptPasswords().crear(f.password));
    const cliente=await login(f.clienteEmail),proveedor=await login(f.proveedorEmail),ajeno=await login(tercero.email);
    const inicio=new Date(Date.now()+86400000).toISOString(),fin=new Date(Date.now()+2*86400000).toISOString();
    const crear=async()=>{const r=await pedir('/reservas','POST',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio,fin,descripcionTrabajo:'Instalar cuatro luminarias y revisar dos tomacorrientes de la vivienda.'},cliente);assert.equal(r.status,201);return r.json();};
    let s=await crear();
    const propuesta={alcance:'Instalación de cuatro luminarias y revisión de tomacorrientes.',materiales:'Incluye mano de obra; luminarias y cableado a cargo del cliente.',importeCentimos:18000,vigenteHasta:new Date(Date.now()+3600000).toISOString()};
    const ruta='/reservas/'+s.id;
    await context.test('roles, origen y campos estrictos; no se publica una propuesta inválida',async()=>{
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version})).status,401);
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version},cliente)).status,403);
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version,estado:'ACEPTADA'},proveedor)).status,400);
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version,vigenteHasta:fin},proveedor)).status,400);
      assert.equal((await pedir('/reservas/'+randomUUID()+'/cotizacion','POST',{...propuesta,versionActual:1},proveedor)).status,404);
      assert.equal((await pedir(ruta,'GET',undefined,ajeno)).status,404);
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:1},ajeno)).status,404);
    });
    await context.test('nueva versión conserva la anterior y rechaza respuesta a versión sustituida',async()=>{
      const r=await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version},proveedor);assert.equal(r.status,201);s=await r.json();
      assert.equal(s.cotizaciones[0].importeCentimos,18000);
      const r2=await pedir(ruta+'/cotizacion','POST',{...propuesta,importeCentimos:20000,versionActual:s.version},proveedor);assert.equal(r2.status,201);s=await r2.json();
      assert.equal(s.cotizaciones.length,2);assert.equal(s.cotizaciones[0].importeCentimos,18000);
      assert.equal((await pedir(ruta+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:1},cliente)).status,409);
      assert.equal((await pedir(ruta+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:2},proveedor)).status,403);
      const rechazada=await pedir(ruta+'/cotizacion/rechazo','POST',{versionActual:s.version,versionCotizacion:2,motivo:'Necesito incluir los materiales en el total acordado.'},cliente);assert.equal(rechazada.status,201);s=await rechazada.json();
      const r3=await pedir(ruta+'/cotizacion','POST',{...propuesta,materiales:'Incluye mano de obra y materiales indicados en el alcance.',importeCentimos:25000,versionActual:s.version},proveedor);assert.equal(r3.status,201);s=await r3.json();
      assert.equal(s.cotizaciones[1].respuesta.decision,'RECHAZADA');
      assert.equal((await pedir(ruta+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:3},ajeno)).status,404);
    });
    await context.test('fallo del outbox revierte la respuesta y la versión de solicitud',async()=>{
      await pool.query("CREATE FUNCTION fallar_cotizacion_prueba() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo='COTIZACION_ACEPTADA' THEN RAISE EXCEPTION 'fallo sintético'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER fallar_cotizacion_prueba BEFORE INSERT ON reservas_outbox FOR EACH ROW EXECUTE FUNCTION fallar_cotizacion_prueba()');
      try {
        assert.equal((await pedir(ruta+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:3},cliente)).status,503);
        const actual=await (await pedir(ruta,'GET',undefined,cliente)).json();assert.equal(actual.version,s.version);assert.equal(actual.cotizaciones[2].respuesta,null);
      } finally {await pool.query('DROP TRIGGER fallar_cotizacion_prueba ON reservas_outbox');await pool.query('DROP FUNCTION fallar_cotizacion_prueba()');}
    });
    await context.test('aceptación concurrente tiene un efecto y conserva el precio servidor con agenda sin pago',async()=>{
      const respuestas=await Promise.all([1,2].map(()=>pedir(ruta+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:3},cliente)));
      assert.deepEqual(respuestas.map(r=>r.status).sort(),[201,409]);s=await respuestas.find(r=>r.status===201)!.json();
      assert.equal(s.cotizaciones[2].importeCentimos,25000);assert.equal(s.cotizaciones[2].respuesta.decision,'ACEPTADA');
      assert.equal(s.pagoEstado,'PENDIENTE');assert.equal(s.efectivoCentimos,0);assert.equal(s.venceEn,null);
      assert.equal(s.estado,'SERVICIO_CONFIRMADO');
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_bloqueos WHERE reserva_id=$1 AND activo',[s.id])).rows[0].n,1);
      assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo='COTIZACION_ACEPTADA'",[s.id])).rows[0].n,1);
      assert.equal((await pedir(ruta+'/cotizacion','POST',{...propuesta,versionActual:s.version},proveedor)).status,409);
      assert.equal((await pedir(ruta+'/rechazo','POST',{versionActual:s.version,motivo:'No corresponde modificar el acuerdo ya aceptado.'},proveedor)).status,409);
      await assert.rejects(()=>pool.query('UPDATE reservas_cotizaciones SET importe_centimos=1 WHERE reserva_id=$1 AND version=3',[s.id]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query('DELETE FROM reservas_cotizaciones WHERE reserva_id=$1',[s.id]),(e:any)=>e.code==='23514');
    });
    await context.test('una propuesta vencida no se acepta ni altera el acuerdo',async()=>{
      assert.equal((await pedir(ruta+'/cancelacion','POST',{versionActual:s.version,motivo:'Cancelación de prueba sin pagos ni anticipo registrado.'},cliente)).status,201);
      const nueva=await crear(),vence=new Date(Date.now()+5000).toISOString();
      const propuestaCorta=await pedir('/reservas/'+nueva.id+'/cotizacion','POST',{...propuesta,versionActual:nueva.version,vigenteHasta:vence},proveedor);
      assert.equal(propuestaCorta.status,201);const cotizada=await propuestaCorta.json();
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,Date.parse(vence)-Date.now()+100)));
      assert.equal((await pedir('/reservas/'+nueva.id+'/cotizacion/aceptacion','POST',{versionActual:cotizada.version,versionCotizacion:1},cliente)).status,409);
      const intacta=await (await pedir('/reservas/'+nueva.id,'GET',undefined,cliente)).json();assert.equal(intacta.version,cotizada.version);assert.equal(intacta.cotizaciones[0].respuesta,null);
      assert.equal((await pedir('/reservas/'+nueva.id+'/cancelacion','POST',{versionActual:intacta.version,motivo:'Finalizar el escenario de vigencia para la siguiente prueba.'},cliente)).status,201);
    });
    await context.test('publicar y aceptar una versión anterior en paralelo nunca acuerda un precio sustituido',async()=>{
      const nueva=await crear(),rutaNueva='/reservas/'+nueva.id;
      const publicada=await pedir(rutaNueva+'/cotizacion','POST',{...propuesta,versionActual:nueva.version},proveedor);assert.equal(publicada.status,201);const primera=await publicada.json();
      const [cambio,aceptacion]=await Promise.all([
        pedir(rutaNueva+'/cotizacion','POST',{...propuesta,importeCentimos:30000,versionActual:primera.version},proveedor),
        pedir(rutaNueva+'/cotizacion/aceptacion','POST',{versionActual:primera.version+1,versionCotizacion:1},cliente),
      ]);
      assert.equal(cambio.status,201);assert.equal(aceptacion.status,409);
      const actual=await (await pedir(rutaNueva,'GET',undefined,cliente)).json();assert.equal(actual.cotizaciones.length,2);assert.equal(actual.cotizaciones[0].respuesta,null);
    });
  } finally {await app.close();await pool.end();}
});
