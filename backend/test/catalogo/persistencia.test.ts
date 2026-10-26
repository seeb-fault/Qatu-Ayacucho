import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {Pool} from 'pg';
import {crearApp} from '../../src/app';
import {PostgresUsuarios} from '../../src/modules/usuarios/infraestructura/postgres';
import {PostgresProveedores} from '../../src/modules/proveedores/infraestructura/postgres';
import {ScryptPasswords} from '../../src/modules/usuarios/infraestructura/passwords';
import {ConsultaCatalogo} from '../../src/modules/catalogo';

test('catálogo real: propiedad, recursos, búsqueda, concurrencia y moderación auditada',{skip:!process.env.TEST_DATABASE_URL},async context=>{
 process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;process.env.JWT_SECRET='secreto-exclusivo-pruebas-catalogo-2026-488';process.env.APP_ORIGIN='http://127.0.0.1:3100';process.env.NODE_ENV='test';
 const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL}),usuarios=new PostgresUsuarios(pool),proveedores=new PostgresProveedores(pool);
 const sufijo=randomUUID(),password='frase segura para el catálogo persistido',hash=await new ScryptPasswords().crear(password);
 const propio=await usuarios.crear('catalogo-'+sufijo+'@example.com','Dueño catálogo',hash),ajeno=await usuarios.crear('catalogo-otro-'+sufijo+'@example.com','Otro dueño',hash),admin=await usuarios.crearAdministrador('catalogo-admin-'+sufijo+'@example.com','Moderador catálogo',hash,'Preparación del escenario de moderación');
 const perfil=await proveedores.crear(propio.id,{nombrePublico:'Taller '+sufijo,descripcion:'Actividad local de herramientas y servicios para proyectos de hogar.',zonaId:'ayacucho',visiblePublicamente:true});
 const otroPerfil=await proveedores.crear(ajeno.id,{nombrePublico:'Otro taller '+sufijo,descripcion:'Actividad local de herramientas y servicios para proyectos de hogar.',zonaId:'ayacucho',visiblePublicamente:true});
 await pool.query("DELETE FROM limites_acceso WHERE clave='ip:127.0.0.1:login'");
 const app=await crearApp();await app.listen(0,'127.0.0.1');const root=(await app.getUrl())+'/api/v1';
 const pedir=(ruta:string,method='GET',body?:unknown,cookie='',origin=process.env.APP_ORIGIN!)=>fetch(root+ruta,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
 const login=async(email:string)=>{const r=await pedir('/auth/login','POST',{email,password});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];};
 const sesion=await login(propio.email),otra=await login(ajeno.email),administrativa=await login(admin.email);
 const datos={tipo:'herramienta',categoriaId:'perforacion',zonaId:'ayacucho',titulo:'Taladro eléctrico '+sufijo,descripcion:'Perforación precisa de concreto y madera para mantenimiento del hogar.',incluye:['Equipo y accesorios'],condiciones:['Retiro y devolución coordinados'],modalidadPrecio:'fija',tarifaCentimos:4250,unidad:'día',activa:true,recursos:[{identificador:'Unidad 1',activo:true},{identificador:'Unidad 2',activo:true}]};
 let oferta:any,servicio:any;
 try{
 await context.test('rechaza anónimos, proveedor sin verificar, origen ajeno y suplantación',async()=>{
  assert.equal((await pedir('/publicaciones','POST',datos)).status,401);assert.equal((await pedir('/publicaciones','POST',datos,sesion)).status,403);
  await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=ANY($1::uuid[])",[[perfil.id,otroPerfil.id]]);
  assert.equal((await pedir('/publicaciones','POST',{...datos,proveedorId:otroPerfil.id},sesion)).status,400);
  assert.equal((await pedir('/publicaciones','POST',datos,sesion,'https://otro.example')).status,403);
 });
 await context.test('crea herramienta y servicio, persiste recursos y excluye datos privados',async()=>{
  const creada=await pedir('/publicaciones','POST',datos,sesion);assert.equal(creada.status,201);oferta=await creada.json();assert.equal(oferta.proveedorId,perfil.id);assert.equal(oferta.recursos.length,2);
  const creadaServicio=await pedir('/publicaciones','POST',{...datos,tipo:'servicio',categoriaId:'electricidad',titulo:'Electricista '+sufijo,modalidadPrecio:'cotizacion',tarifaCentimos:null,unidad:null,recursos:[{identificador:'Agenda principal',activo:true}]},sesion);assert.equal(creadaServicio.status,201);servicio=await creadaServicio.json();
  const publica=await pedir('/publicaciones/'+oferta.id);assert.equal(publica.status,200);const proyeccion=await publica.json();for(const campo of ['usuarioId','email','documentos','version','estadoModeracion'])assert.equal(Object.hasOwn(proyeccion,campo),false);assert.equal(JSON.stringify(proyeccion).includes(propio.email),false);
  assert.equal((await app.get(ConsultaCatalogo).consultar(oferta.id)).tarifaCentimos,4250);
  assert.equal((await pedir('/publicaciones/'+oferta.id,'PATCH',{...datos,recursos:oferta.recursos,versionActual:1},otra)).status,403);
 });
 await context.test('búsqueda española sin tildes, filtros AND, presupuesto y orden estable',async()=>{
  const ruta='/publicaciones?q='+encodeURIComponent('electrico '+sufijo)+'&categoriaId=perforacion&zonaId=ayacucho&precioMaximoCentimos=4250';
  const r=await pedir(ruta);assert.equal(r.status,200);const pagina=await r.json();assert.equal(pagina.total,1);assert.equal(pagina.items[0].id,oferta.id);
  assert.equal((await (await pedir('/publicaciones?q='+sufijo+'&precioMaximoCentimos=4249')).json()).total,0);
  assert.equal((await (await pedir('/publicaciones?q='+sufijo+'&limit=1&page=1&orden=precio')).json()).items[0].id,oferta.id);
  assert.equal((await (await pedir('/publicaciones?q='+sufijo+'&limit=1&page=2&orden=precio')).json()).items[0].id,servicio.id);
  assert.equal((await pedir('/publicaciones?limit=51')).status,400);assert.equal((await pedir('/publicaciones?q=a&q=b')).status,400);
 });
 await context.test('paginación predeterminada de veinte mantiene orden e IDs sin duplicados',async()=>{
  for(let i=0;i<21;i++)assert.equal((await pedir('/publicaciones','POST',{...datos,titulo:'Paginación '+sufijo+' '+i},sesion)).status,201);
  const primera=await (await pedir('/publicaciones?q='+encodeURIComponent('paginacion '+sufijo))).json();
  const segunda=await (await pedir('/publicaciones?q='+encodeURIComponent('paginacion '+sufijo)+'&page=2')).json();
  assert.equal(primera.total,21);assert.equal(primera.limit,20);assert.equal(primera.items.length,20);assert.equal(segunda.items.length,1);
  assert.equal(new Set([...primera.items,...segunda.items].map((p:any)=>p.id)).size,21);
  const repetida=await (await pedir('/publicaciones?q='+encodeURIComponent('paginacion '+sufijo))).json();assert.deepEqual(repetida.items.map((p:any)=>p.id),primera.items.map((p:any)=>p.id));
 });
 await context.test('ediciones concurrentes: una gana, preserva IDs y la otra obtiene 409',async()=>{
  const body={...datos,recursos:oferta.recursos,versionActual:oferta.version};
  const cambios=await Promise.all([pedir('/publicaciones/'+oferta.id,'PATCH',{...body,titulo:datos.titulo+' A'},sesion),pedir('/publicaciones/'+oferta.id,'PATCH',{...body,titulo:datos.titulo+' B'},sesion)]);
  assert.deepEqual(cambios.map(r=>r.status).sort(),[200,409]);oferta=await cambios.find(r=>r.status===200)!.json();assert.deepEqual(oferta.recursos.map((r:any)=>r.id).sort(),body.recursos.map((r:any)=>r.id).sort());
  assert.equal((await pedir('/publicaciones/'+oferta.id,'PATCH',{...body,versionActual:oferta.version,recursos:[{identificador:'Sustitución',activo:true}]},sesion)).status,400);
 });
 await context.test('base de datos rechaza tarifas y recursos incoherentes incluso fuera del HTTP',async()=>{
  await assert.rejects(()=>pool.query('UPDATE catalogo_tarifas SET monto_centimos=NULL WHERE publicacion_id=$1',[oferta.id]),(e:any)=>e.code==='23514');
  await assert.rejects(()=>pool.query("UPDATE catalogo_tarifas SET unidad='servicio' WHERE publicacion_id=$1",[oferta.id]),(e:any)=>e.code==='23514');
  await assert.rejects(()=>pool.query('UPDATE catalogo_recursos SET activo=false WHERE publicacion_id=$1',[oferta.id]),(e:any)=>e.code==='23514');
 });
 await context.test('moderación auditada: cliente rechazado, retirada oculta y dueño no puede reactivar',async()=>{
  const ruta='/admin/publicaciones/'+oferta.id+'/moderacion',body={estado:'retirada',motivo:'Retirada sintética por condiciones incompletas',versionActual:oferta.version};
  assert.equal((await pedir(ruta,'PATCH',body,sesion)).status,403);
  const r=await pedir(ruta,'PATCH',body,administrativa);assert.equal(r.status,200);oferta=await r.json();assert.equal((await pedir('/publicaciones/'+oferta.id)).status,404);
  assert.equal((await pedir('/publicaciones/'+oferta.id,'PATCH',{...datos,recursos:oferta.recursos,versionActual:oferta.version},sesion)).status,409);
  const historial=await (await pedir('/admin/publicaciones/'+oferta.id+'/auditoria','GET',undefined,administrativa)).json();assert.equal(historial.length,1);assert.equal(historial[0].actorId,admin.id);assert.equal(historial[0].motivo,body.motivo);
  assert.equal((await pedir('/admin/publicaciones/'+oferta.id+'/auditoria','GET',undefined,sesion)).status,403);
 });
 await context.test('perfil oculto, aprobación revocada o cuenta inactiva excluyen publicaciones',async()=>{
  await pool.query('UPDATE proveedores SET visible_publicamente=false WHERE id=$1',[perfil.id]);assert.equal((await pedir('/publicaciones/'+servicio.id)).status,404);assert.equal((await pedir('/publicaciones','POST',datos,sesion)).status,403);
  await pool.query("UPDATE proveedores SET visible_publicamente=true,estado_verificacion='no_solicitada' WHERE id=$1",[perfil.id]);assert.equal((await pedir('/publicaciones/'+servicio.id)).status,404);
  await pool.query("UPDATE proveedores SET estado_verificacion='aprobada' WHERE id=$1",[perfil.id]);await pool.query("UPDATE usuarios SET estado='inactivo' WHERE id=$1",[propio.id]);assert.equal((await pedir('/publicaciones/'+servicio.id)).status,404);assert.equal((await pedir('/publicaciones','POST',datos,sesion)).status,401);
 });
 }finally{await app.close();await pool.end();}
});
