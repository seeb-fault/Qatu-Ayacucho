import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { PostgresProveedores } from '../../src/modules/proveedores/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

test('alquiler real: 100 carreras, vencimiento, efectivo bilateral y devolución', { skip: !process.env.TEST_DATABASE_URL }, async context => {
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;process.env.JWT_SECRET='secreto-exclusivo-calendario-pruebas-2026-488';process.env.APP_ORIGIN='http://127.0.0.1:3100';process.env.NODE_ENV='test';
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL}),usuarios=new PostgresUsuarios(pool),proveedores=new PostgresProveedores(pool);
  const sufijo=randomUUID(),password='frase exclusiva para alquiler de pruebas',hash=await new ScryptPasswords().crear(password);
  const titular=await usuarios.crear('calendario-p-'+sufijo+'@example.com','Proveedor calendario',hash);
  const a=await usuarios.crear('calendario-a-'+sufijo+'@example.com','Cliente A',hash),b=await usuarios.crear('calendario-b-'+sufijo+'@example.com','Cliente B',hash);
  const perfil=await proveedores.crear(titular.id,{nombrePublico:'Taller calendario '+sufijo,descripcion:'Herramientas sintéticas para verificar disponibilidad y efectivo.',zonaId:'ayacucho',visiblePublicamente:true});
  await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=$1",[perfil.id]);
  await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='')=>fetch(root+ruta,{method,headers:{Origin:process.env.APP_ORIGIN!,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  try {
    const p=await login(titular.email),ca=await login(a.email),cb=await login(b.email);
    const crearOferta=async()=>{
      const r=await pedir('/publicaciones','POST',{tipo:'herramienta',categoriaId:'perforacion',zonaId:'ayacucho',titulo:'Taladro calendario '+randomUUID(),descripcion:'Herramienta sintética para pruebas de disponibilidad y entrega local.',incluye:['Equipo'],condiciones:['Coordinar horario'],modalidadPrecio:'fija',tarifaCentimos:4250,unidad:'día',activa:true,recursos:[{identificador:'Unidad',activo:true}]},p);
      assert.equal(r.status,201);return r.json();
    };
    const oferta=await crearOferta();
    const solicitar=async(inicio:string,fin:string,cookie=ca,extra:Record<string,unknown>={},publicacion=oferta)=>{
      const r=await pedir('/reservas','POST',{publicacionId:publicacion.id,recursoId:publicacion.recursos[0].id,inicio,fin,aceptaCondiciones:true,tarifaEsperadaCentimos:4250,...extra},cookie);
      assert.equal(r.status,201);return r.json();
    };
    const operar=(s:any,accion:string,cookie=p,extra:Record<string,unknown>={})=>pedir('/reservas/'+s.id+'/'+accion,'POST',{versionActual:s.version,...extra},cookie);
    const leer=async(id:string,cookie=ca)=>{const r=await pedir('/reservas/'+id,'GET',undefined,cookie);assert.equal(r.status,200);return r.json();};
    const inicio=new Date(Date.now()+600000).toISOString(),fin=new Date(Date.parse(inicio)+86400000).toISOString();

    await context.test('condiciones explícitas, tarifa esperada y permisos; visita no bloquea',async()=>{
      const body={publicacionId:oferta.id,recursoId:oferta.recursos[0].id,inicio,fin};
      assert.equal((await pedir('/reservas','POST',body,ca)).status,400);
      assert.equal((await pedir('/reservas','POST',{...body,aceptaCondiciones:true,tarifaEsperadaCentimos:1},ca)).status,409);
      const visita=await solicitar(inicio,fin,ca,{tipoSolicitud:'visita'});
      assert.equal(visita.condiciones,null);assert.equal((await operar(visita,'aceptacion')).status,409);
      const r=await operar(visita,'visita',p,{motivo:'Visita coordinada para revisar la herramienta'});assert.equal(r.status,201);
      const acordada=await r.json();assert.equal(acordada.estado,'VISITA_ACORDADA');assert.equal(acordada.venceEn,null);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_bloqueos WHERE reserva_id=$1',[visita.id])).rows[0].n,0);
      const alquiler=await solicitar(inicio,fin);
      assert.equal((await operar(alquiler,'aceptacion',ca)).status,403);
      assert.equal((await operar(alquiler,'aceptacion',cb)).status,404);
      assert.equal((await operar(alquiler,'aceptacion',p,{importe:1})).status,400);
      const aceptada=await (await operar(alquiler,'aceptacion')).json();assert.equal(aceptada.estado,'ACEPTADA');
      assert.equal((await operar(aceptada,'cancelacion',ca,{motivo:'Cancelación de prueba antes de entregar efectivo'})).status,201);
    });
    await context.test('fallo de outbox revierte aceptación y bloqueo',async()=>{
      const s=await solicitar(inicio,fin);
      await pool.query("CREATE FUNCTION fallo_aceptacion_0052() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo='SOLICITUD_ACEPTADA' THEN RAISE EXCEPTION 'fallo de prueba'; END IF; RETURN NEW; END $$");
      await pool.query('CREATE TRIGGER prueba_aceptacion_0052 BEFORE INSERT ON reservas_outbox FOR EACH ROW EXECUTE FUNCTION fallo_aceptacion_0052()');
      try {
        assert.equal((await operar(s,'aceptacion')).status,503);
        assert.equal((await leer(s.id)).estado,'PENDIENTE');
        assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_bloqueos WHERE reserva_id=$1',[s.id])).rows[0].n,0);
      } finally {await pool.query('DROP TRIGGER prueba_aceptacion_0052 ON reservas_outbox');await pool.query('DROP FUNCTION fallo_aceptacion_0052()');}
      assert.equal((await operar(s,'cancelacion',ca,{motivo:'Cerrar fixture de fallo de escritura'})).status,201);
    });
    await context.test('EQ-07 local: 100 pares concurrentes, una aceptación por par y cero rangos superpuestos',async()=>{
      for(let i=0;i<100;i++){
        const ini=new Date(Date.parse(inicio)+(i+2)*2*86400000).toISOString(),f=new Date(Date.parse(ini)+86400000).toISOString();
        const x=await solicitar(ini,f,ca),y=await solicitar(ini,f,cb);
        const carreras=await Promise.all([operar(x,'aceptacion'),operar(y,'aceptacion')]);
        assert.deepEqual(carreras.map(r=>r.status).sort(),[201,409],'par '+i);
      }
      const solapamientos=await pool.query(`SELECT count(*)::integer AS n FROM reservas_bloqueos a JOIN reservas_bloqueos b
        ON a.recurso_id=b.recurso_id AND a.reserva_id<b.reserva_id AND a.activo AND b.activo
        AND tstzrange(a.inicio,a.fin,'[)') && tstzrange(b.inicio,b.fin,'[)') WHERE a.recurso_id=$1`,[oferta.recursos[0].id]);
      assert.equal(solapamientos.rows[0].n,0);
      assert.equal((await pool.query('SELECT count(*)::integer AS n FROM reservas_bloqueos WHERE recurso_id=$1 AND activo',[oferta.recursos[0].id])).rows[0].n,100);
    });
    await context.test('ampliación con motivo, vencimiento contra efectivo y liberación para otra solicitud',async()=>{
      const s=await solicitar(inicio,fin),aceptada=await (await operar(s,'aceptacion')).json();
      await pool.query("UPDATE reservas SET vence_en=clock_timestamp()+interval '10 minutes' WHERE id=$1",[s.id]);
      const ampliada=await (await operar(aceptada,'ampliacion',p,{motivo:'Cliente solicita más tiempo para acercarse'})).json();assert.equal(ampliada.estado,'ACEPTADA');
      assert.ok(Date.parse(ampliada.venceEn)-Date.now()>3500000);
      // Se adelanta el reloj del fixture persistido, sin esperar una hora ni modificar código productivo.
      await pool.query("UPDATE reservas SET vence_en=clock_timestamp()-interval '1 second' WHERE id=$1",[s.id]);
      const resultados=await Promise.all([operar(ampliada,'efectivo'),pedir('/reservas?vista=proveedor','GET',undefined,p)]);
      assert.equal(resultados[0].status,409);const vencida=await leer(s.id);assert.equal(vencida.estado,'VENCIDA');assert.equal(vencida.efectivoCentimos,0);
      assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo='RESERVA_VENCIDA'",[s.id])).rows[0].n,1);
      const nueva=await solicitar(inicio,fin,cb);assert.equal((await operar(nueva,'aceptacion')).status,201);
      const ocupada=await leer(nueva.id,cb);assert.equal((await operar(ocupada,'cancelacion',cb,{motivo:'Cerrar escenario de vencimiento sin efectivo'})).status,201);
    });
    await context.test('rangos adyacentes, disponibilidad privada y posesión física única',async()=>{
      const otra=await crearOferta(),primer=await solicitar(inicio,fin,ca,{},otra),segundo=await solicitar(fin,new Date(Date.parse(fin)+86400000).toISOString(),cb,{},otra);
      let uno=await (await operar(primer,'aceptacion')).json(),dos=await (await operar(segundo,'aceptacion')).json();
      assert.equal(uno.estado,'ACEPTADA');assert.equal(dos.estado,'ACEPTADA');
      const consulta='/recursos/'+otra.recursos[0].id+'/disponibilidad?'+new URLSearchParams({publicacionId:otra.id,inicio,fin:new Date(Date.parse(fin)+86400000).toISOString()});
      const disponibilidad=await (await pedir(consulta)).json();assert.equal(disponibilidad.franjas.length,2);assert.equal(disponibilidad.enUso,false);
      assert.deepEqual(Object.keys(disponibilidad.franjas[0]).sort(),['fin','inicio']);assert.equal(JSON.stringify(disponibilidad).includes(a.id),false);
      const registros=await Promise.all([operar(uno,'efectivo'),operar(uno,'efectivo')]);assert.deepEqual(registros.map(r=>r.status).sort(),[201,409]);
      uno=await registros.find(r=>r.status===201)!.json();assert.equal(uno.pagoEstado,'REGISTRADO_PROVEEDOR');assert.equal(uno.estado,'ENTREGA_POR_CONFIRMAR');
      assert.equal((await pool.query("SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo='EFECTIVO_REGISTRADO'",[uno.id])).rows[0].n,1);
      assert.equal((await operar(uno,'recepcion',p)).status,403);assert.equal((await operar(uno,'cancelacion',ca,{motivo:'No cancelar después de declarar efectivo'})).status,409);
      assert.equal((await operar(dos,'efectivo')).status,409);
      uno=await (await operar(uno,'recepcion',ca)).json();assert.equal(uno.pagoEstado,'CONFIRMADO_PARTICIPANTES');
      let aviso=await (await operar(uno,'devolucion/aviso',ca)).json();
      assert.equal((await operar(aviso,'devolucion/confirmacion',ca)).status,403);
      uno=await (await operar(aviso,'devolucion/rechazo',p,{motivo:'La herramienta aún no llegó al taller'})).json();assert.equal(uno.estado,'EN_CURSO');
      aviso=await (await operar(uno,'devolucion/aviso',ca)).json();
      const devuelta=await (await operar(aviso,'devolucion/confirmacion')).json();assert.equal(devuelta.estado,'DEVUELTA');assert.equal(devuelta.saldoCentimos,0);
      assert.equal((await pool.query('SELECT activo FROM reservas_bloqueos WHERE reserva_id=$1',[uno.id])).rows[0].activo,false);
      assert.equal((await operar(dos,'efectivo')).status,201);
    });
    await context.test('devolución tardía calcula saldo sin declarar recibido efectivo adicional',async()=>{
      const otra=await crearOferta();let s=await solicitar(inicio,fin,ca,{},otra);
      s=await (await operar(s,'aceptacion')).json();s=await (await operar(s,'efectivo')).json();s=await (await operar(s,'recepcion',ca)).json();
      // Fixture temporal: adelanta el fin pactado sin esperar un día real; mantiene coherente el bloqueo.
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query("UPDATE reservas SET inicio=clock_timestamp()-interval '1 day 31 minutes',fin=clock_timestamp()-interval '31 minutes' WHERE id=$1",[s.id]);
        await client.query('UPDATE reservas_bloqueos b SET inicio=r.inicio,fin=r.fin FROM reservas r WHERE b.reserva_id=r.id AND r.id=$1',[s.id]);
        await client.query('COMMIT');
      }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
      s=await (await operar(s,'devolucion/aviso',ca)).json();s=await (await operar(s,'devolucion/confirmacion')).json();
      assert.equal(s.estado,'DEVUELTA');assert.equal(s.diasExtra,1);assert.equal(s.importeFinalCentimos,8500);
      assert.equal(s.efectivoCentimos,4250);assert.equal(s.saldoCentimos,4250);assert.equal(s.pagoEstado,'CONFIRMADO_PARTICIPANTES');
    });
    await context.test('PostgreSQL impide estado aceptado sin bloqueo coherente',async()=>{
      const s=await solicitar(inicio,fin);
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='ACEPTADA',vence_en=clock_timestamp()+interval '1 hour' WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
      assert.equal((await leer(s.id)).estado,'PENDIENTE');
      await assert.rejects(()=>pool.query("UPDATE reservas SET condiciones=condiciones || '{\"importeCentimos\":1}'::jsonb WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
    });
  } finally {await app.close();await pool.end();}
});
