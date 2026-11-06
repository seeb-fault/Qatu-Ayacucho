import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { Pool } from 'pg';
import { crearApp } from '../../src/app';
import { Pagos } from '../../src/modules/reservas/aplicacion/pagos';
import { entradaPago, type CargoExterno, type ProcesadorPagos, type ResultadoPago, type SolicitudCobro } from '../../src/modules/reservas/dominio/pagos';
import { crearProcesador, ProcesadorCulqi, ProcesadorDoble } from '../../src/modules/reservas/infraestructura/culqi';
import { PostgresReservas } from '../../src/modules/reservas/infraestructura/postgres';
import { PostgresUsuarios } from '../../src/modules/usuarios/infraestructura/postgres';
import { ScryptPasswords } from '../../src/modules/usuarios/infraestructura/passwords';

const HORA=3600000,COBRO:SolicitudCobro={intentoId:'11111111-1111-4111-8111-111111111111',reservaId:'r',importeCentimos:4250,moneda:'PEN',tokenId:'tkn_test_x',email:'a@example.com',descripcion:'d'};
const CARGO={object:'charge',id:'chr_test_abc',amount:4250,currency:'PEN',state:'Exitosa',response_code:'venta_exitosa',metadata:{intento_id:COBRO.intentoId}};
const culqi=(status:number,cuerpo:unknown,llamadas:{url:string;init:RequestInit}[]=[])=>new ProcesadorCulqi('sk_test_x',(async(url:string,init:RequestInit)=>{llamadas.push({url,init});return new Response(cuerpo===null?'no es json':JSON.stringify(cuerpo),{status});}) as typeof fetch);

test('Culqi: envía importe de servidor con llave secreta y solo aprueba un cargo exitoso coherente',async()=>{
  const llamadas:{url:string;init:RequestInit}[]=[];
  assert.deepEqual(await culqi(201,CARGO,llamadas).cobrar(COBRO),{estado:'aprobado',referencia:'chr_test_abc'});
  assert.equal(llamadas[0].url,'https://api.culqi.com/v2/charges');assert.equal((llamadas[0].init.headers as Record<string,string>).Authorization,'Bearer sk_test_x');
  const enviado=JSON.parse(String(llamadas[0].init.body));
  assert.deepEqual([enviado.amount,enviado.currency_code,enviado.source_id,enviado.capture,enviado.metadata.intento_id],[4250,'PEN','tkn_test_x',true,COBRO.intentoId]);
  assert.deepEqual(await culqi(200,CARGO).cobrar(COBRO),{estado:'aprobado',referencia:'chr_test_abc'},'la documentación se contradice sobre 200 y 201');
});

test('Culqi: la incertidumbre nunca se trata como pago ni como rechazo',async()=>{
  const desconocido={estado:'desconocido'};
  assert.deepEqual(await culqi(500,{object:'error'}).cobrar(COBRO),desconocido);
  assert.deepEqual(await culqi(503,null).cobrar(COBRO),desconocido);
  assert.deepEqual(await culqi(201,{...CARGO,amount:1}).cobrar(COBRO),desconocido,'importe distinto');
  assert.deepEqual(await culqi(201,{...CARGO,currency:'USD'}).cobrar(COBRO),desconocido,'moneda distinta');
  assert.deepEqual(await culqi(201,{...CARGO,state:'Otro',response_code:'otro'}).cobrar(COBRO),desconocido,'sin éxito claro');
  const roto=new ProcesadorCulqi('sk_test_x',(async()=>{throw new Error('red caída');}) as typeof fetch);
  assert.deepEqual(await roto.cobrar(COBRO),desconocido);
  const lento=new ProcesadorCulqi('sk_test_x',((_:string,i:RequestInit)=>new Promise((_r,rej)=>{i.signal!.addEventListener('abort',()=>rej(new Error('timeout')));})) as typeof fetch,'https://x',10);
  assert.deepEqual(await lento.cobrar(COBRO),desconocido);
});

test('Culqi: rechazos con código limpio, 3DS sin integrar y consultas',async()=>{
  assert.deepEqual(await culqi(402,{object:'error',type:'card_error',decline_code:'insufficient_funds'}).cobrar(COBRO),{estado:'rechazado',codigo:'INSUFFICIENT_FUNDS'});
  assert.deepEqual(await culqi(400,{object:'error',decline_code:'falló ana@example.com'}).cobrar(COBRO),{estado:'rechazado',codigo:'FALL__ANA_EXAMPLE_COM'});
  assert.deepEqual(await culqi(200,{action_code:'REVIEW'}).cobrar(COBRO),{estado:'rechazado',codigo:'AUTENTICACION_3DS_REQUERIDA'});
  assert.equal(await culqi(404,{object:'error'}).consultar('chr_test_x'),null);assert.equal(await culqi(200,CARGO).consultar('../otra'),null);
  assert.equal((await culqi(200,CARGO).consultar('chr_test_abc'))?.intentoId,COBRO.intentoId);
  await assert.rejects(()=>culqi(500,{}).consultar('chr_test_abc'));
  const lista={data:[{...CARGO,id:'chr_test_otro',metadata:{intento_id:'otro'}},CARGO]};
  assert.equal((await culqi(200,lista).buscarPorIntento({id:COBRO.intentoId,importeCentimos:4250}))?.referencia,'chr_test_abc');
  assert.equal(await culqi(200,{data:[]}).buscarPorIntento({id:COBRO.intentoId,importeCentimos:4250}),null);
});

test('solo sandbox: se rechazan llaves y tokens reales, y el doble no entra en producción',()=>{
  assert.throws(()=>new ProcesadorCulqi('sk_live_x'),/llaves de prueba/);
  assert.throws(()=>entradaPago({tokenId:'tkn_live_abc'}));assert.throws(()=>entradaPago({tokenId:'tkn_test_abc',importeCentimos:1}));
  assert.deepEqual(entradaPago({tokenId:'tkn_test_abc'}),{tokenId:'tkn_test_abc'});
  const antes={m:process.env.QATU_PAGOS,n:process.env.NODE_ENV,p:process.env.CULQI_PUBLIC_KEY,s:process.env.CULQI_SECRET_KEY};
  const fijar=(k:string,v?:string)=>{if(v===undefined)delete process.env[k];else process.env[k]=v;};
  try {
    fijar('QATU_PAGOS');fijar('CULQI_PUBLIC_KEY');fijar('CULQI_SECRET_KEY');assert.equal(crearProcesador().procesador,null);
    fijar('CULQI_PUBLIC_KEY','pk_live_x');fijar('CULQI_SECRET_KEY','sk_live_x');assert.throws(()=>crearProcesador(),/llaves de prueba/);
    fijar('CULQI_PUBLIC_KEY','pk_test_x');fijar('CULQI_SECRET_KEY','sk_test_x');assert.ok(crearProcesador().procesador instanceof ProcesadorCulqi);
    fijar('QATU_PAGOS','doble');fijar('NODE_ENV','production');assert.throws(()=>crearProcesador(),/producción/);
  } finally {fijar('QATU_PAGOS',antes.m);fijar('NODE_ENV',antes.n);fijar('CULQI_PUBLIC_KEY',antes.p);fijar('CULQI_SECRET_KEY',antes.s);}
});

test('pagos reales en PostgreSQL: herramienta, oficio, idempotencia, incertidumbre y pago tardío',{skip:!process.env.TEST_DATABASE_URL},async context=>{
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET='secreto-exclusivo-pagos-pruebas-2026-488';process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:3100';process.env.QATU_DESPACHO_EVENTOS='inactivo';process.env.QATU_PAGOS='doble';
  const fixture=(...a:string[])=>JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts',...a],{encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const h=fixture(),o=fixture('--servicio');
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const tercero=await new PostgresUsuarios(pool).crear('pagos-'+randomUUID()+'@example.com','Tercero',await new ScryptPasswords().crear(h.password));
  const app=await crearApp();await app.listen(0,'127.0.0.1');const root=await app.getUrl()+'/api/v1';
  const pedir=(ruta:string,method='GET',body?:unknown,cookie='',extra:Record<string,string>={},origen=true)=>fetch(root+ruta,{method,headers:{...(origen?{Origin:process.env.APP_ORIGIN!}:{}),'Content-Type':'application/json',Cookie:cookie,...extra},body:body===undefined?undefined:JSON.stringify(body)});
  const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password:h.password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
  let turno=0;
  try {
    const [clienteH,proveedorH,clienteO,proveedorO,ajeno]=[await login(h.clienteEmail),await login(h.proveedorEmail),await login(o.clienteEmail),await login(o.proveedorEmail),await login(tercero.email)];
    const paso=async(s:any,sufijo:string,cookie:string,extra={},esperado=201)=>{const r=await pedir('/reservas/'+s.id+'/'+sufijo,'POST',{versionActual:s.version,...extra},cookie);assert.equal(r.status,esperado,sufijo);return r.json();};
    const apartada=async()=>{
      const desde=Date.now()+(48+48*turno++)*HORA,fin=desde+24*HORA;
      const r=await pedir('/reservas','POST',{publicacionId:h.publicacionId,recursoId:h.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(fin).toISOString(),aceptaCondiciones:true,tarifaEsperadaCentimos:4250},clienteH);assert.equal(r.status,201);
      return paso(await r.json(),'aceptacion',proveedorH);
    };
    const oficioPorPagar=async()=>{
      const desde=Date.now()+(48+48*turno++)*HORA;
      const a=await pedir('/reservas','POST',{publicacionId:o.publicacionId,recursoId:o.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+HORA).toISOString(),descripcionTrabajo:'Revisar tomacorrientes e instalar luminarias en la vivienda.'},clienteO);assert.equal(a.status,201);const s=await a.json();
      const p=await paso(s,'cotizacion',proveedorO,{alcance:'Revisión de tomacorrientes e instalación de luminarias.',materiales:'Solo mano de obra; materiales del cliente.',importeCentimos:18050,vigenteHasta:new Date(Date.now()+HORA).toISOString()});
      const c=await paso(p,'cotizacion/aceptacion',clienteO,{versionCotizacion:1});
      const n=turno++,inicio=new Date(Date.now()-(2*n+2)*HORA).toISOString(),fin=new Date(Date.now()-(2*n+1)*HORA).toISOString(),k=await pool.connect();
      try {await k.query('BEGIN');await k.query('UPDATE reservas SET inicio=$2,fin=$3 WHERE id=$1',[c.id,inicio,fin]);await k.query('UPDATE reservas_bloqueos SET inicio=$2,fin=$3 WHERE reserva_id=$1',[c.id,inicio,fin]);await k.query('COMMIT');} finally {k.release();}
      return paso(await paso(c,'servicio/inicio',proveedorO),'servicio/cobro',proveedorO);
    };
    const pagar=(s:any,token:string,cookie=clienteH,clave:string=randomUUID())=>pedir('/reservas/'+s.id+'/pagos','POST',{tokenId:token},cookie,{'Idempotency-Key':clave});
    const leer=async(id:string,cookie:string)=>(await pedir('/reservas/'+id,'GET',undefined,cookie)).json();
    const bloqueo=async(id:string)=>(await pool.query('SELECT activo FROM reservas_bloqueos WHERE reserva_id=$1',[id])).rows[0]?.activo;
    const fila=async(id:string)=>(await pool.query('SELECT * FROM reservas_pagos WHERE reserva_id=$1 ORDER BY creado_en',[id])).rows;
    const eventos=async(id:string,tipo:string)=>(await pool.query('SELECT count(*)::integer AS n FROM reservas_outbox WHERE agregado_id=$1 AND tipo=$2',[id,tipo])).rows[0].n;
    // Procesador propio para simular a la pasarela sin depender del de la app.
    const directo=(procesador:ProcesadorPagos,ahora?:()=>number)=>new Pagos(new PostgresReservas(pool),{resolver:async()=>{throw new Error('sin uso');}},procesador,'pk_test_x',ahora);

    await context.test('la configuración es pública y solo expone la llave de prueba',async()=>{
      assert.deepEqual(await (await pedir('/pagos/configuracion')).json(),{disponible:true,llavePublica:'pk_test_doble',modo:'prueba'});
    });

    await context.test('herramienta: paga el importe del servidor, se entrega y se devuelve sin saldo',async()=>{
      const s=await apartada(),ruta='/reservas/'+s.id+'/pagos',clave=randomUUID(),cuerpo={tokenId:'tkn_test_bueno'},cabecera={'Idempotency-Key':clave};
      assert.equal((await pedir(ruta,'POST',cuerpo,'',cabecera)).status,401);
      assert.equal((await pedir(ruta,'POST',cuerpo,ajeno,cabecera)).status,404);
      assert.equal((await pedir(ruta,'POST',cuerpo,proveedorH,cabecera)).status,403);
      assert.equal((await pedir(ruta,'POST',cuerpo,clienteH)).status,400,'exige clave');
      assert.equal((await pedir(ruta,'POST',{tokenId:'tkn_live_real'},clienteH,cabecera)).status,400);
      assert.equal((await pedir(ruta,'POST',{...cuerpo,importeCentimos:1},clienteH,cabecera)).status,400,'el importe no viene del navegador');
      assert.equal((await pedir(ruta,'POST',cuerpo,clienteH,{...cabecera,Origin:'https://otro.example'})).status,403);
      assert.equal((await fila(s.id)).length,0,'los rechazos previos no crean intentos');
      const r=await pagar(s,'tkn_test_bueno',clienteH,clave);assert.equal(r.status,201);const intento=await r.json();
      assert.equal(intento.estado,'APROBADO');assert.equal(intento.importeCentimos,s.condiciones.importeCentimos);
      let actual=await leer(s.id,clienteH);
      assert.equal(actual.estado,'APARTADO_PAGADO');assert.equal(actual.pagoEstado,'PAGADO_EN_LINEA');assert.equal(actual.pagadoEnLineaCentimos,s.condiciones.importeCentimos);assert.equal(actual.efectivoCentimos,0);assert.equal(actual.venceEn,null);assert.equal(actual.ultimoPago.estado,'APROBADO');
      assert.equal(JSON.stringify(await fila(s.id)).includes('tkn_test_bueno'),false,'el token no se guarda');
      assert.equal(await eventos(s.id,'PAGO_APROBADO'),1);
      assert.equal((await pagar(actual,'tkn_test_otro')).status,409,'no se paga dos veces');
      assert.equal((await pedir('/reservas/'+s.id+'/efectivo','POST',{versionActual:actual.version},proveedorH)).status,409,'tampoco en efectivo');
      assert.equal((await pedir('/reservas/'+s.id+'/entrega','POST',{versionActual:actual.version},clienteH)).status,403);
      actual=await paso(actual,'entrega',proveedorH);assert.equal(actual.estado,'ENTREGA_POR_CONFIRMAR');assert.ok(actual.entregadoEn);
      actual=await paso(actual,'recepcion',clienteH);assert.equal(actual.estado,'EN_CURSO');assert.equal(actual.pagoEstado,'PAGADO_EN_LINEA');
      actual=await paso(await paso(actual,'devolucion/aviso',clienteH),'devolucion/confirmacion',proveedorH);
      assert.equal(actual.estado,'DEVUELTA');assert.equal(actual.importeFinalCentimos,s.condiciones.importeCentimos);assert.equal(actual.saldoCentimos,0);assert.equal(await bloqueo(s.id),false);
      const vista=await (await pedir(ruta,'GET',undefined,proveedorH)).json();assert.equal(vista.items.length,1);assert.equal(vista.items[0].referencia,undefined);
      assert.equal((await pedir(ruta,'GET',undefined,ajeno)).status,404);
    });

    await context.test('veinte repeticiones de la misma clave tienen un solo efecto; otra carga con esa clave es conflicto',async()=>{
      const s=await apartada(),clave=randomUUID();
      const respuestas=await Promise.all(Array.from({length:20},()=>pagar(s,'tkn_test_repetido',clienteH,clave)));
      assert.ok(respuestas.every(r=>[201,202].includes(r.status)),respuestas.map(r=>r.status).join());
      assert.equal(new Set(await Promise.all(respuestas.map(async r=>(await r.json()).id))).size,1);
      assert.equal((await fila(s.id)).length,1);assert.equal(await eventos(s.id,'PAGO_APROBADO'),1);
      assert.equal((await pagar(s,'tkn_test_distinto',clienteH,clave)).status,409);
      const c=await paso(await leer(s.id,clienteH),'cancelacion',clienteH,{motivo:'Ya no necesito la herramienta para el trabajo.'});assert.equal(c.estado,'CANCELADA');
    });

    await context.test('claves distintas a la vez no abren dos cobros',async()=>{
      const s=await apartada(),r=await Promise.all(Array.from({length:6},(_,i)=>pagar(s,'tkn_test_carrera'+i)));
      const codigos=r.map(x=>x.status).sort();assert.equal(codigos.filter(c=>c===201).length,1,codigos.join());assert.equal(codigos.filter(c=>c===409).length,5);
      assert.equal((await fila(s.id)).filter(f=>f.estado==='APROBADO').length,1);
      await paso(await leer(s.id,clienteH),'cancelacion',proveedorH,{motivo:'No puedo entregar la unidad por una avería.'});
    });

    await context.test('un rechazo no cambia la reserva y permite intentar de nuevo',async()=>{
      const s=await apartada(),r=await pagar(s,'tkn_test_rechaza');assert.equal(r.status,201);const i=await r.json();
      assert.equal(i.estado,'RECHAZADO');assert.equal(i.codigo,'INSUFFICIENT_FUNDS');
      const a=await leer(s.id,clienteH);assert.equal(a.estado,'ACEPTADA');assert.equal(a.version,s.version);assert.equal(a.pagoEstado,'PENDIENTE');assert.equal(a.ultimoPago.codigo,'INSUFFICIENT_FUNDS');
      assert.equal((await pagar(s,'tkn_test_bueno2')).status,201);
      const c=await paso(await leer(s.id,clienteH),'cancelacion',clienteH,{motivo:'Cambié de planes para este trabajo.'});assert.equal(c.pagoEstado,'PAGADO_EN_LINEA');
    });

    await context.test('cancelar tras pagar libera la unidad y deja el reembolso pendiente, sin devolver solo',async()=>{
      const s=await apartada();assert.equal((await pagar(s,'tkn_test_cancela')).status,201);
      const c=await paso(await leer(s.id,clienteH),'cancelacion',clienteH,{motivo:'Encontré otra solución para el trabajo.'});
      assert.equal(c.estado,'CANCELADA');assert.equal(c.ultimoPago.reembolsoPendiente,true);assert.equal(await bloqueo(s.id),false);
      const [p]=await fila(s.id);assert.equal(p.reembolso_motivo,'RESERVA_CANCELADA');assert.equal(p.estado,'APROBADO');assert.equal(await eventos(s.id,'REEMBOLSO_PENDIENTE'),1);
    });

    await context.test('un timeout queda desconocido, bloquea otro cobro y se concilia sin volver a cobrar',async()=>{
      const s=await apartada(),r=await pagar(s,'tkn_test_timeout');assert.equal(r.status,202);const i=await r.json();assert.equal(i.estado,'DESCONOCIDO');
      const conflicto=await pagar(s,'tkn_test_otro_intento');assert.equal(conflicto.status,409);assert.equal((await conflicto.json()).code,'PAGO_EN_CURSO');
      let cobros=0;const cargo:CargoExterno={referencia:'chr_test_'+randomUUID().replace(/-/g,''),intentoId:i.id,importeCentimos:i.importeCentimos,moneda:'PEN',exitoso:true};
      const pasarela:ProcesadorPagos={cobrar:async():Promise<ResultadoPago>=>{cobros++;return {estado:'desconocido'};},consultar:async()=>cargo,buscarPorIntento:async({id})=>id===i.id?cargo:null};
      const resultado=await directo(pasarela).conciliar(50);assert.ok(resultado.aprobados>=1);assert.equal(cobros,0);
      const a=await leer(s.id,clienteH);assert.equal(a.estado,'APARTADO_PAGADO');assert.equal(a.ultimoPago.estado,'APROBADO');
      await directo(pasarela).conciliar(50);assert.equal(await eventos(s.id,'PAGO_APROBADO'),1,'conciliar otra vez no repite efectos');
      await paso(a,'cancelacion',clienteH,{motivo:'Cancelo después de la conciliación del pago.'});
    });

    await context.test('sin cargo localizado sigue desconocido, y pasada una hora permite reintentar',async()=>{
      const s=await apartada(),r=await pagar(s,'tkn_test_timeout_sin_cargo');assert.equal(r.status,202);const i=await r.json();
      const vacia:ProcesadorPagos={cobrar:async()=>({estado:'desconocido'}),consultar:async()=>null,buscarPorIntento:async()=>null};
      await directo(vacia).conciliar(50);assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO');
      await directo(vacia,()=>Date.now()+61*60000).conciliar(50);const [p]=await fila(s.id);assert.equal(p.estado,'RECHAZADO');assert.equal(p.codigo,'SIN_CARGO_CONFIRMADO');
      assert.equal((await leer(s.id,clienteH)).estado,'ACEPTADA');
      const cargo:CargoExterno={referencia:'chr_test_'+randomUUID().replace(/-/g,''),intentoId:i.id,importeCentimos:i.importeCentimos,moneda:'PEN',exitoso:true};
      assert.equal((await new PostgresReservas(pool).aprobarPago(i.id,cargo.referencia))?.estado,'APROBADO','un cargo que aparece tarde también se registra');
      const a=await leer(s.id,clienteH);assert.equal(a.estado,'APARTADO_PAGADO');
      await paso(a,'cancelacion',clienteH,{motivo:'Cancelo tras localizar el cargo tardío.'});
    });

    await context.test('pago tardío: no reactiva la reserva vencida ni quita la unidad a otra persona',async()=>{
      const s=await apartada(),r=await pagar(s,'tkn_test_timeout_tardio');assert.equal(r.status,202);const i=await r.json();
      await pool.query("UPDATE reservas SET vence_en=clock_timestamp()-interval '1 second' WHERE id=$1",[s.id]);
      await new PostgresReservas(pool).vencer();assert.equal((await leer(s.id,clienteH)).estado,'VENCIDA');assert.equal(await bloqueo(s.id),false);
      const aprobado=await new PostgresReservas(pool).aprobarPago(i.id,'chr_test_'+randomUUID().replace(/-/g,''));
      assert.equal(aprobado?.reembolsoPendiente,true);
      const a=await leer(s.id,clienteH);assert.equal(a.estado,'VENCIDA');assert.equal(a.pagoEstado,'PENDIENTE');assert.equal(a.pagadoEnLineaCentimos,0);assert.equal(await bloqueo(s.id),false);
      assert.equal((await fila(s.id))[0].reembolso_motivo,'PAGO_TARDIO');assert.equal(await eventos(s.id,'REEMBOLSO_PENDIENTE'),1);assert.equal(await eventos(s.id,'PAGO_APROBADO'),0);
    });

    await context.test('webhook: sin origen, un aviso falso no aprueba y veinte reenvíos tienen un efecto',async()=>{
      const s=await apartada(),r=await pagar(s,'tkn_test_timeout_webhook');const i=await r.json(),webhook=(b:unknown)=>pedir('/pagos/webhooks/culqi','POST',b,'',{},false);
      const falso=await webhook({object:'event',type:'charge.creation.succeeded',data:{id:'chr_test_falso',amount:1}});assert.equal(falso.status,200);
      assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO','la app consulta a la pasarela y no encuentra ese cargo');
      assert.equal((await webhook({otra:'cosa'})).status,200);
      const referencia='chr_test_'+randomUUID().replace(/-/g,''),coincide={referencia,intentoId:i.id,importeCentimos:i.importeCentimos,moneda:'PEN',exitoso:true};
      const con=(c:CargoExterno)=>directo({cobrar:async()=>({estado:'desconocido'}),consultar:async()=>c,buscarPorIntento:async()=>null});
      await con({...coincide,importeCentimos:1}).webhook({id:'evt_'+randomUUID(),data:referencia});assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO','importe incorrecto');
      await con({...coincide,moneda:'USD'}).webhook({id:'evt_'+randomUUID(),data:referencia});assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO','moneda incorrecta');
      await con({...coincide,exitoso:false}).webhook({id:'evt_'+randomUUID(),data:referencia});assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO','cargo sin éxito');
      await con({...coincide,intentoId:randomUUID()}).webhook({id:'evt_'+randomUUID(),data:referencia});assert.equal((await fila(s.id))[0].estado,'DESCONOCIDO','otro intento');
      const evento='evt_'+randomUUID();let consultas=0;
      const contada=directo({cobrar:async()=>({estado:'desconocido'}),consultar:async()=>{consultas++;return coincide;},buscarPorIntento:async()=>null});
      for(let n=0;n<20;n++)await contada.webhook({id:evento,data:{object:{id:referencia}}});
      assert.equal(consultas,1,'el evento repetido se deduplica');assert.equal(await eventos(s.id,'PAGO_APROBADO'),1);
      const a=await leer(s.id,clienteH);assert.equal(a.estado,'APARTADO_PAGADO');
      await paso(a,'cancelacion',clienteH,{motivo:'Cancelo tras confirmar el aviso de la pasarela.'});
    });

    await context.test('oficio: se paga el total aceptado al terminar y el cierre libera la agenda',async()=>{
      const s=await oficioPorPagar();assert.equal(s.estado,'SERVICIO_POR_PAGAR');assert.ok(s.servicioTerminadoEn);assert.equal(s.pagoEstado,'PENDIENTE');
      assert.equal((await pedir('/reservas/'+s.id+'/servicio/cobro','POST',{versionActual:s.version},clienteO)).status,403);
      const r=await pagar(s,'tkn_test_oficio',clienteO);assert.equal(r.status,201);assert.equal((await r.json()).importeCentimos,18050);
      const a=await leer(s.id,clienteO);assert.equal(a.estado,'SERVICIO_CERRADO');assert.equal(a.pagoEstado,'PAGADO_EN_LINEA');assert.equal(a.pagadoEnLineaCentimos,18050);assert.equal(a.importeFinalCentimos,18050);assert.ok(a.servicioCerradoEn);assert.equal(await bloqueo(s.id),false);
      assert.equal(a.efectivoCentimos,0);
    });

    await context.test('oficio: el cliente puede rechazar el cobro y el proveedor pasar a efectivo',async()=>{
      const s=await oficioPorPagar();
      const rechazado=await paso(s,'servicio/rechazo',clienteO,{motivo:'Faltó terminar parte del trabajo acordado.'});assert.equal(rechazado.estado,'SERVICIO_EN_CURSO');assert.equal(rechazado.servicioTerminadoEn,null);
      assert.equal((await pagar(rechazado,'tkn_test_antes',clienteO)).status,409,'sin cobro solicitado no se paga');
      const cobro=await paso(rechazado,'servicio/cobro',proveedorO);
      const efectivo=await paso(cobro,'servicio/termino',proveedorO);assert.equal(efectivo.estado,'SERVICIO_POR_CONFIRMAR');assert.equal(efectivo.efectivoCentimos,18050);
      const cerrado=await paso(efectivo,'servicio/confirmacion',clienteO);assert.equal(cerrado.pagoEstado,'CONFIRMADO_PARTICIPANTES');assert.equal(cerrado.pagadoEnLineaCentimos,0);
    });

    await context.test('PostgreSQL rechaza importes incoherentes y dos intentos activos',async()=>{
      const s=await oficioPorPagar();
      await assert.rejects(()=>pool.query("UPDATE reservas SET estado='SERVICIO_CERRADO',pago_estado='PAGADO_EN_LINEA',pagado_en_linea_centimos=1,importe_final_centimos=1,servicio_cerrado_en=clock_timestamp() WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
      await assert.rejects(()=>pool.query("UPDATE reservas SET pagado_en_linea_centimos=5 WHERE id=$1",[s.id]),(e:any)=>e.code==='23514');
      const clienteId=(await pool.query('SELECT cliente_id FROM reservas WHERE id=$1',[s.id])).rows[0].cliente_id,insertar=()=>pool.query('INSERT INTO reservas_pagos(id,reserva_id,cliente_id,clave,huella,importe_centimos) VALUES($1,$2,$3,$4,$5,1)',[randomUUID(),s.id,clienteId,randomUUID(),'a'.repeat(64)]);
      await insertar();await assert.rejects(insertar,(e:any)=>e.constraint==='reservas_pagos_activo');
    });
  } finally {await app.close();await pool.end();}
});

test('sin pasarela configurada no se ofrece el pago en línea',async()=>{
  const repo={} as never,identidad={resolver:async()=>({id:'x',email:'a@example.com'})};
  const p=new Pagos(repo,identidad,null,null);
  assert.deepEqual(p.configuracion(),{disponible:false,llavePublica:null,modo:'prueba'});
  await assert.rejects(()=>p.iniciar('t',randomUUID(),randomUUID(),{tokenId:'tkn_test_x'}),(e:any)=>e.status===503);
  assert.deepEqual(await p.conciliar(),{aprobados:0,sinCargo:0,pendientes:0});
  assert.ok(new ProcesadorDoble());
});
