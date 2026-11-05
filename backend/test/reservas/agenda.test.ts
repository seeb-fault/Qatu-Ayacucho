import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

test('agenda de oficios: exclusión concurrente, cancelación, rollback y acuerdos históricos', {skip:!process.env.TEST_DATABASE_URL}, async context=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-agenda-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const otro=await new PostgresUsuarios(pool).crear('agenda-'+randomUUID()+'@example.com','Otro cliente',await new ScryptPasswords().crear(f.password));
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='')=>fetch(root+ruta,{method,headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password:f.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  try {
    const cliente=await login(f.clienteEmail),clienteB=await login(otro.email),proveedor=await login(f.proveedorEmail);
    const base=Date.now()+3*86400000;
    const solicitar=async(cookie=cliente,desde=base,hasta=desde+3600000)=>{
      const r=await pedir('/reservas','POST',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(hasta).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},cookie);
      assert.equal(r.status,201);return r.json();
    };
    const cotizar=async(s:any)=>{
      const r=await pedir('/reservas/'+s.id+'/cotizacion','POST',{versionActual:s.version,alcance:'Revisión de tomacorrientes e instalación de luminarias.',materiales:'Solo mano de obra; materiales provistos por el cliente.',importeCentimos:18050,vigenteHasta:new Date(Date.now()+3600000).toISOString()},proveedor);
      assert.equal(r.status,201);return r.json();
    };
    const aceptar=(s:any,cookie=cliente)=>pedir('/reservas/'+s.id+'/cotizacion/aceptacion','POST',{versionActual:s.version,versionCotizacion:1},cookie);
    const consultar=async(id:string,cookie=cliente)=>(await pedir('/reservas/'+id,'GET',undefined,cookie)).json();
    let ganadora:any,perdedora:any,cookieGanadora='',cookiePerdedora='';
    await context.test('dos clientes para la misma agenda: una aceptación, un conflicto y cero efectos parciales',async()=>{
      const a=await cotizar(await solicitar()),b=await cotizar(await solicitar(clienteB));
      const resultados=await Promise.all([aceptar(a),aceptar(b,clienteB)]);
      assert.deepEqual(resultados.map(r=>r.status).sort(),[201,409]);
      const i=resultados.findIndex(r=>r.status===201);ganadora=await resultados[i].json();perdedora=i===0?b:a;cookieGanadora=i===0?cliente:clienteB;cookiePerdedora=i===0?clienteB:cliente;
      assert.equal(ganadora.estado,'SERVICIO_CONFIRMADO');assert.equal(ganadora.pagoEstado,'PENDIENTE');assert.equal(ganadora.efectivoCentimos,0);assert.equal(ganadora.venceEn,null);
      const intacta=await consultar(perdedora.id,cookiePerdedora);assert.equal(intacta.estado,'PENDIENTE');assert.equal(intacta.version,perdedora.version);assert.equal(intacta.cotizaciones[0].respuesta,null);
      assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo IN ('COTIZACION_ACEPTADA','AGENDA_CONFIRMADA')",[perdedora.id])).rows[0].n,0);
      const q=new URLSearchParams({publicacionId:f.publicacionId,inicio:ganadora.inicio,fin:ganadora.fin});
      const disponibilidad=await (await pedir('/recursos/'+f.recursoId+'/disponibilidad?'+q)).json();assert.equal(disponibilidad.franjas.length,1);assert.equal(disponibilidad.enUso,false);
      assert.equal(Object.hasOwn(disponibilidad.franjas[0],'clienteId'),false);
      await assert.rejects(()=>pool.query('UPDATE reservas_bloqueos SET activo=false WHERE reserva_id=$1',[ganadora.id]),(e:any)=>e.code==='23514');
    });
    await context.test('cancelar antes del inicio libera agenda sin reescribir precio y permite aceptar la otra propuesta',async()=>{
      const r=await pedir('/reservas/'+ganadora.id+'/cancelacion','POST',{versionActual:ganadora.version,motivo:'El cliente y el proveedor coordinan cancelar antes del inicio.'},proveedor);assert.equal(r.status,201);
      const cancelada=await r.json();assert.equal(cancelada.estado,'CANCELADA');assert.equal(cancelada.cotizaciones[0].respuesta.decision,'ACEPTADA');assert.equal(cancelada.cotizaciones[0].importeCentimos,18050);
      assert.equal((await pool.query('SELECT activo FROM reservas_bloqueos WHERE reserva_id=$1',[ganadora.id])).rows[0].activo,false);
      const siguiente=await aceptar(perdedora,cookiePerdedora);assert.equal(siguiente.status,201);ganadora=await siguiente.json();cookieGanadora=cookiePerdedora;
      const repetida=await aceptar({...perdedora,version:ganadora.version},cookieGanadora);assert.equal(repetida.status,409);
    });
    await context.test('rangos adyacentes se permiten y los servicios no vencen por el temporizador de herramientas',async()=>{
      const adyacente=await cotizar(await solicitar(cliente,base+3600000,base+7200000));
      const r=await aceptar(adyacente);assert.equal(r.status,201);const s=await r.json();
      assert.equal(s.estado,'SERVICIO_CONFIRMADO');assert.equal(s.venceEn,null);
      const recargada=await consultar(s.id);assert.equal(recargada.estado,'SERVICIO_CONFIRMADO');
      await assert.rejects(()=>pool.query("UPDATE reservas SET vence_en=clock_timestamp()-interval '1 minute' WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
    });
    await context.test('si falla el evento de agenda se revierten cotización, estado y bloqueo',async()=>{
      const s=await cotizar(await solicitar(cliente,base+3*3600000));
      await pool.query("CREATE FUNCTION fallar_agenda_prueba() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo='AGENDA_CONFIRMADA' THEN RAISE EXCEPTION 'fallo sintético de agenda'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER fallar_agenda_prueba BEFORE INSERT ON reservas_outbox FOR EACH ROW EXECUTE FUNCTION fallar_agenda_prueba()');
      try {
        assert.equal((await aceptar(s)).status,503);
        const intacta=await consultar(s.id);assert.equal(intacta.estado,'PENDIENTE');assert.equal(intacta.version,s.version);assert.equal(intacta.cotizaciones[0].respuesta,null);
        assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_bloqueos WHERE reserva_id=$1',[s.id])).rows[0].n,0);
        assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo='COTIZACION_ACEPTADA'",[s.id])).rows[0].n,0);
      } finally {await pool.query('DROP TRIGGER fallar_agenda_prueba ON reservas_outbox');await pool.query('DROP FUNCTION fallar_agenda_prueba()');}
    });
    await context.test('acuerdos de 005.3 requieren confirmación expresa del cliente y conservan su aceptación histórica',async()=>{
      const s=await solicitar(cliente,base+5*3600000),ruta='/reservas/'+s.id;
      await pool.query(`INSERT INTO reservas_cotizaciones(reserva_id,version,alcance,materiales,importe_centimos,vigente_hasta,creada_en,decision,respondida_en)
        VALUES($1,1,'Instalación acordada con el proveedor antes de habilitar la agenda.','Solo mano de obra, materiales a cargo del cliente.',22000,clock_timestamp()-interval '1 day',clock_timestamp()-interval '3 days','ACEPTADA',clock_timestamp()-interval '2 days')`,[s.id]);
      const previa=await consultar(s.id);assert.equal(previa.estado,'PENDIENTE');assert.equal(previa.cotizaciones[0].respuesta.decision,'ACEPTADA');
      const entrada={versionActual:s.version,versionCotizacion:1};
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',entrada)).status,401);
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',entrada,proveedor)).status,403);
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',entrada,clienteB)).status,404);
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',{...entrada,importeCentimos:1},cliente)).status,400);
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',{...entrada,versionCotizacion:2},cliente)).status,409);
      const r=await pedir(ruta+'/agenda/confirmacion','POST',entrada,cliente);assert.equal(r.status,201);const guardada=await r.json();
      assert.equal(guardada.estado,'SERVICIO_CONFIRMADO');assert.deepEqual(guardada.cotizaciones,previa.cotizaciones);
      assert.equal((await pedir(ruta+'/agenda/confirmacion','POST',{...entrada,versionActual:guardada.version},cliente)).status,409);
      const sinAcuerdo=await solicitar(cliente,base+7*3600000);
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='SERVICIO_CONFIRMADO' WHERE id=$1",[sinAcuerdo.id]),(e:any)=>e.code==='23514');
    });
  } finally {await app.close();await pool.end();}
});
