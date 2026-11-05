import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const HORA=3600000,IMPORTE=18050,MOTIVO='El trabajo no se realizó como estaba acordado.';

test('ejecución de oficios: inicio, término, efectivo bilateral, cancelación sin iniciar y rollback',{skip:!process.env.TEST_DATABASE_URL},async context=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-ejecucion-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const tercero=await new PostgresUsuarios(pool).crear('ejecucion-'+randomUUID()+'@example.com','Tercero',await new ScryptPasswords().crear(f.password));
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='')=>fetch(root+ruta,{method,headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password:f.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  let turno=0;
  try {
    const cliente=await login(f.clienteEmail),proveedor=await login(f.proveedorEmail),ajeno=await login(tercero.email);
    const confirmado=async()=>{
      const desde=Date.now()+(10+2*turno++)*HORA;
      const a=await pedir('/reservas','POST',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+HORA).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},cliente);assert.equal(a.status,201);const s=await a.json();
      const b=await pedir('/reservas/'+s.id+'/cotizacion','POST',{versionActual:s.version,alcance:'Revisión de tomacorrientes e instalación de luminarias.',materiales:'Solo mano de obra; materiales del cliente.',importeCentimos:IMPORTE,vigenteHasta:new Date(Date.now()+HORA).toISOString()},proveedor);assert.equal(b.status,201);const p=await b.json();
      const c=await pedir('/reservas/'+s.id+'/cotizacion/aceptacion','POST',{versionActual:p.version,versionCotizacion:1},cliente);assert.equal(c.status,201);return c.json();
    };
    // Lleva el horario al pasado en una transacción: el trigger diferido exige reserva y bloqueo coherentes.
    const llegarHora=async(s:any)=>{
      const n=turno++,inicio=new Date(Date.now()-(2*n+2)*HORA).toISOString(),fin=new Date(Date.now()-(2*n+1)*HORA).toISOString(),c=await pool.connect();
      try {await c.query('BEGIN');await c.query('UPDATE reservas SET inicio=$2,fin=$3 WHERE id=$1',[s.id,inicio,fin]);await c.query('UPDATE reservas_bloqueos SET inicio=$2,fin=$3 WHERE reserva_id=$1',[s.id,inicio,fin]);await c.query('COMMIT');}
      catch(e){await c.query('ROLLBACK');throw e;} finally {c.release();}
    };
    const accion=(s:any,sufijo:string,cookie:string,extra={})=>pedir('/reservas/'+s.id+'/'+sufijo,'POST',{versionActual:s.version,...extra},cookie);
    const paso=async(s:any,sufijo:string,cookie:string,extra={})=>{const r=await accion(s,sufijo,cookie,extra);assert.equal(r.status,201,sufijo);return r.json();};
    const eventos=async(id:string)=>(await pool.query('SELECT tipo FROM reservas_outbox WHERE agregado_id=$1',[id])).rows.map(r=>r.tipo);
    const bloqueoActivo=async(id:string)=>(await pool.query('SELECT activo FROM reservas_bloqueos WHERE reserva_id=$1',[id])).rows[0].activo;

    await context.test('permisos y hora: nadie inicia antes de tiempo y cada acción pertenece a su participante',async()=>{
      const s=await confirmado();
      assert.equal((await accion(s,'servicio/inicio',proveedor)).status,409);
      await llegarHora(s);
      assert.equal((await accion(s,'servicio/inicio','')).status,401);
      assert.equal((await accion(s,'servicio/inicio',ajeno)).status,404);
      assert.equal((await accion(s,'servicio/inicio',cliente)).status,403);
      assert.equal((await accion(s,'servicio/inicio',proveedor,{iniciadoEn:new Date().toISOString()})).status,400);
      assert.equal((await accion(s,'servicio/termino',proveedor)).status,409);
      assert.equal((await accion({...s,version:s.version+5},'servicio/inicio',proveedor)).status,409);
      const iniciado=await paso(s,'servicio/inicio',proveedor);
      assert.equal(iniciado.estado,'SERVICIO_EN_CURSO');assert.equal(iniciado.pagoEstado,'PENDIENTE');assert.equal(iniciado.efectivoCentimos,0);assert.ok(iniciado.servicioIniciadoEn);
      assert.equal((await accion(iniciado,'servicio/confirmacion',cliente)).status,409);
      assert.equal((await accion(iniciado,'servicio/termino',cliente)).status,403);
    });

    await context.test('ciclo completo: el efectivo es el total aceptado, el rechazo lo anula y el cierre libera la agenda',async()=>{
      const s=await confirmado();await llegarHora(s);
      const iniciado=await paso(s,'servicio/inicio',proveedor);
      assert.equal((await accion(iniciado,'servicio/termino',proveedor,{importeCentimos:1})).status,400);
      const terminado=await paso(iniciado,'servicio/termino',proveedor);
      assert.equal(terminado.estado,'SERVICIO_POR_CONFIRMAR');assert.equal(terminado.pagoEstado,'REGISTRADO_PROVEEDOR');assert.equal(terminado.efectivoCentimos,IMPORTE);
      assert.equal(await bloqueoActivo(s.id),true);
      assert.equal((await accion(terminado,'servicio/confirmacion',proveedor)).status,403);
      assert.equal((await accion(terminado,'servicio/rechazo',cliente,{motivo:'corto'})).status,400);
      const rechazado=await paso(terminado,'servicio/rechazo',cliente,{motivo:MOTIVO});
      assert.equal(rechazado.estado,'SERVICIO_EN_CURSO');assert.equal(rechazado.pagoEstado,'PENDIENTE');assert.equal(rechazado.efectivoCentimos,0);assert.equal(rechazado.servicioTerminadoEn,null);assert.equal(rechazado.motivoOperacion,MOTIVO);assert.ok(rechazado.servicioIniciadoEn);
      const otraVez=await paso(rechazado,'servicio/termino',proveedor);
      const cerrado=await paso(otraVez,'servicio/confirmacion',cliente);
      assert.equal(cerrado.estado,'SERVICIO_CERRADO');assert.equal(cerrado.pagoEstado,'CONFIRMADO_PARTICIPANTES');assert.equal(cerrado.efectivoCentimos,IMPORTE);assert.equal(cerrado.importeFinalCentimos,IMPORTE);assert.equal(cerrado.saldoCentimos,0);assert.ok(cerrado.servicioCerradoEn);
      assert.equal(cerrado.cotizaciones[0].importeCentimos,IMPORTE);assert.equal(cerrado.cotizaciones[0].respuesta.decision,'ACEPTADA');
      assert.equal(await bloqueoActivo(s.id),false);
      const tipos=await eventos(s.id);
      for(const tipo of ['SERVICIO_INICIADO','TERMINO_RECHAZADO','SERVICIO_CERRADO'])assert.equal(tipos.filter(t=>t===tipo).length,1,tipo);
      assert.equal(tipos.filter(t=>t==='SERVICIO_TERMINADO').length,2);
      assert.equal((await accion(cerrado,'servicio/confirmacion',cliente)).status,409);
      assert.equal((await accion(cerrado,'cancelacion',cliente,{motivo:MOTIVO})).status,409);
    });

    await context.test('sin iniciar se cancela con motivo aunque pasó la hora; iniciado ya no se cancela',async()=>{
      const s=await confirmado();await llegarHora(s);
      assert.equal((await accion(s,'cancelacion',cliente,{motivo:'corto'})).status,400);
      const cancelada=await paso(s,'cancelacion',cliente,{motivo:'El proveedor no se presentó a la hora acordada.'});
      assert.equal(cancelada.estado,'CANCELADA');assert.equal(cancelada.pagoEstado,'PENDIENTE');assert.equal(cancelada.efectivoCentimos,0);assert.equal(cancelada.cotizaciones[0].respuesta.decision,'ACEPTADA');
      assert.equal(await bloqueoActivo(s.id),false);
      assert.equal((await accion(cancelada,'servicio/inicio',proveedor)).status,409);
      const t=await confirmado();await llegarHora(t);
      const iniciado=await paso(t,'servicio/inicio',proveedor);
      assert.equal((await accion(iniciado,'cancelacion',proveedor,{motivo:MOTIVO})).status,409);
      assert.equal(await bloqueoActivo(t.id),true);
    });

    await context.test('confirmar y rechazar a la vez tiene un solo efecto',async()=>{
      const s=await confirmado();await llegarHora(s);
      const terminado=await paso(await paso(s,'servicio/inicio',proveedor),'servicio/termino',proveedor);
      const resultados=await Promise.all([accion(terminado,'servicio/confirmacion',cliente),accion(terminado,'servicio/rechazo',cliente,{motivo:MOTIVO})]);
      assert.deepEqual(resultados.map(r=>r.status).sort(),[201,409]);
      const final=(await pool.query('SELECT version FROM reservas WHERE id=$1',[s.id])).rows[0].version;
      assert.equal(final,terminado.version+1);
    });

    await context.test('si falla el evento de cierre se conservan estado, efectivo y agenda',async()=>{
      const s=await confirmado();await llegarHora(s);
      const terminado=await paso(await paso(s,'servicio/inicio',proveedor),'servicio/termino',proveedor);
      await pool.query("CREATE FUNCTION fallar_cierre_prueba() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo='SERVICIO_CERRADO' THEN RAISE EXCEPTION 'fallo sintético de cierre'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER fallar_cierre_prueba BEFORE INSERT ON reservas_outbox FOR EACH ROW EXECUTE FUNCTION fallar_cierre_prueba()');
      try {
        assert.equal((await accion(terminado,'servicio/confirmacion',cliente)).status,503);
        const intacta=await (await pedir('/reservas/'+s.id,'GET',undefined,cliente)).json();
        assert.equal(intacta.estado,'SERVICIO_POR_CONFIRMAR');assert.equal(intacta.version,terminado.version);assert.equal(intacta.servicioCerradoEn,null);assert.equal(intacta.pagoEstado,'REGISTRADO_PROVEEDOR');
        assert.equal(await bloqueoActivo(s.id),true);
      } finally {await pool.query('DROP TRIGGER fallar_cierre_prueba ON reservas_outbox');await pool.query('DROP FUNCTION fallar_cierre_prueba()');}
    });

    await context.test('PostgreSQL rechaza importes ajenos a la cotización y estados incoherentes',async()=>{
      const s=await confirmado();await llegarHora(s);
      const iniciado=await paso(s,'servicio/inicio',proveedor);
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='SERVICIO_POR_CONFIRMAR',pago_estado='REGISTRADO_PROVEEDOR',efectivo_centimos=1,servicio_terminado_en=clock_timestamp() WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='SERVICIO_CERRADO',pago_estado='CONFIRMADO_PARTICIPANTES',efectivo_centimos=$2,servicio_terminado_en=clock_timestamp(),servicio_cerrado_en=clock_timestamp() WHERE id=$1",[s.id,IMPORTE]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query('UPDATE reservas_bloqueos SET activo=false WHERE reserva_id=$1',[s.id]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='SERVICIO_CONFIRMADO' WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
      assert.equal(iniciado.estado,'SERVICIO_EN_CURSO');
    });

    await context.test('las acciones de oficio no se aplican a estados de herramienta ni a solicitudes pendientes',async()=>{
      const desde=Date.now()+200*HORA;
      const r=await pedir('/reservas','POST',{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+HORA).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},cliente);
      const s=await r.json();
      for(const [sufijo,cookie] of [['servicio/inicio',proveedor],['servicio/termino',proveedor],['servicio/confirmacion',cliente]] as const) assert.equal((await accion(s,sufijo,cookie)).status,409,sufijo);
    });
  } finally {await app.close();await pool.end();}
});
