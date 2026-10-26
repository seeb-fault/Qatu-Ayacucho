import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const origin='http://127.0.0.1:3100';
const password='frase segura para catálogo de navegador';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=','base64');

test('publicar requiere sesión y un perfil público verificado; no concede permisos por interfaz',async({page})=>{
 await page.goto('/publicar');await expect(page.getByRole('link',{name:'Ingresar para publicar una oferta'})).toBeVisible();
 expect((await page.request.post('/api/v1/auth/registro',{headers:{Origin:origin},data:{email:'no-verificado-'+crypto.randomUUID()+'@example.com',nombre:'Cliente de catálogo',password}})).status()).toBe(201);
 await page.reload();await expect(page.getByRole('heading',{name:'Prepara tu perfil para publicar'})).toBeVisible();await expect(page.getByRole('form',{name:'Editor de oferta'})).toHaveCount(0);
 expect((await page.request.post('/api/v1/publicaciones',{headers:{Origin:origin},data:{}})).status()).toBe(404);
 await page.goto('/admin/publicaciones');await expect(page.getByRole('main').getByRole('alert')).toContainText('cuenta administrativa');
});

test('oferta persistida: publicar, buscar, editar, conflicto de versión, desactivar y moderar',async({page,browser})=>{
 test.setTimeout(180000);
 const sufijo=crypto.randomUUID(),email='oferta-web-'+sufijo+'@example.com',emailAdmin='admin-oferta-'+sufijo+'@example.com';
 const titulo='Taladro de prueba '+sufijo.slice(0,8);
 execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','scripts/aprovisionar-admin.ts'],{cwd:resolve('../backend'),stdio:'pipe',env:{...process.env,QATU_ADMIN_EMAIL:emailAdmin,QATU_ADMIN_NOMBRE:'Moderador de ofertas',QATU_ADMIN_PASSWORD:password,QATU_ADMIN_MOTIVO:'Preparar recorrido E2E de catálogo'}});
 expect((await page.request.post('/api/v1/auth/registro',{headers:{Origin:origin},data:{email,nombre:'Publicador de prueba',password}})).status()).toBe(201);
 const creado=await page.request.post('/api/v1/proveedores/me',{headers:{Origin:origin},data:{nombrePublico:'Taller '+sufijo,descripcion:'Herramientas y mantenimiento para los proyectos de nuestra comunidad.',zonaId:'ayacucho',visiblePublicamente:true}});expect(creado.status()).toBe(201);const perfil=await creado.json();
 const solicitud=await page.request.post('/api/v1/proveedores/me/verificaciones',{headers:{Origin:origin},multipart:{versionActual:String(perfil.version),aceptaConservacion:'true',documentos:{name:'sintetico.png',mimeType:'image/png',buffer:png}}});expect(solicitud.status(),await solicitud.text()).toBe(201);const enviada=await solicitud.json();
 const admin=await browser.newContext({baseURL:origin});
 try{
 expect((await admin.request.post('/api/v1/auth/login',{headers:{Origin:origin},data:{email:emailAdmin,password}})).status()).toBe(200);
 expect((await admin.request.post('/api/v1/admin/proveedores/'+perfil.id+'/verificacion',{headers:{Origin:origin},data:{solicitudId:enviada.id,decision:'aprobada',motivo:'Documento sintético aceptado para ensayo del catálogo'}})).status()).toBe(201);
 await page.goto('/');await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Publicar una oferta'}).click();
 const editor=page.getByRole('form',{name:'Editor de oferta'});
 await editor.getByLabel('Título',{exact:true}).fill(titulo);await editor.getByLabel('Descripción',{exact:true}).fill('Taladro de mantenimiento para perforar concreto y madera en proyectos locales.');
 await editor.getByLabel('Tarifa en soles (por día)',{exact:true}).fill('42.50');await editor.getByRole('button',{name:'Añadir unidad'}).click();
 await editor.getByRole('button',{name:'Publicar oferta',exact:true}).click();await expect(page.getByRole('status')).toContainText('se guardó');
 let propia=(await (await page.request.get('/api/v1/publicaciones/mias')).json()).items.find((p:any)=>p.titulo===titulo);expect(propia.recursos).toHaveLength(2);expect(propia.tarifaCentimos).toBe(4250);const ids=propia.recursos.map((r:any)=>r.id).sort();
 await page.goto('/buscar?q='+encodeURIComponent(titulo));await expect(page.locator('.offer-card')).toHaveCount(1);await page.locator('.offer-card h3 a').click();await expect(page.getByRole('heading',{level:1})).toHaveText(titulo);await expect(page.locator('.detail-price')).toContainText('42.50');
 await page.goto('/publicar');await page.getByRole('article',{name:titulo,exact:true}).getByRole('button',{name:'Editar '+titulo,exact:true}).click();
 await editor.getByLabel('Título',{exact:true}).fill(titulo+' editado');await editor.getByRole('button',{name:'Guardar cambios de la oferta'}).click();await expect(page.getByRole('status')).toContainText('se guardó');
 const guardada=(await (await page.request.get('/api/v1/publicaciones/mias')).json()).items.find((p:any)=>p.id===propia.id);expect(guardada.recursos.map((r:any)=>r.id).sort()).toEqual(ids);
 const {id,proveedorId,version,estadoModeracion,creadoEn,actualizadoEn,...datos}=propia;
 expect((await page.request.patch('/api/v1/publicaciones/'+id,{headers:{Origin:origin},data:{...datos,versionActual:version}})).status()).toBe(409);
 propia=guardada;
 await editor.getByLabel('Oferta activa',{exact:true}).uncheck();await editor.getByRole('button',{name:'Guardar cambios de la oferta'}).click();await expect(page.getByRole('status')).toContainText('se guardó');
 expect((await page.request.get('/api/v1/publicaciones/'+propia.id)).status()).toBe(404);
 await editor.getByLabel('Oferta activa',{exact:true}).check();await editor.getByRole('button',{name:'Guardar cambios de la oferta'}).click();await expect(page.getByRole('status')).toContainText('se guardó');
 const moderacion=await admin.newPage();await moderacion.goto('/admin/publicaciones');const articulo=moderacion.getByRole('article',{name:titulo+' editado',exact:true});await articulo.getByLabel('Motivo de moderación',{exact:true}).fill('Retirada de prueba por información insuficiente');await articulo.getByRole('button',{name:'Retirar publicación',exact:true}).click();await expect(articulo.getByRole('button',{name:'Levantar retirada'})).toBeVisible();
 expect((await page.request.get('/api/v1/publicaciones/'+propia.id)).status()).toBe(404);await articulo.getByRole('button',{name:'Ver historial de moderación'}).click();await expect(articulo.getByLabel('Historial de moderación')).toContainText('Retirada de prueba por información insuficiente');
 await page.goto('/publicar');await page.getByRole('article',{name:titulo+' editado',exact:true}).getByRole('button',{name:'Editar '+titulo+' editado',exact:true}).click();await editor.getByRole('button',{name:'Guardar cambios de la oferta'}).click();await expect(page.getByRole('main').getByRole('alert')).toContainText('retirada');
 await page.setViewportSize({width:360,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/catalogo-editor-360.png',fullPage:true});
 await articulo.getByLabel('Motivo de moderación',{exact:true}).fill('Correcciones revisadas y retirada levantada');await articulo.getByRole('button',{name:'Levantar retirada'}).click();await expect(articulo.getByRole('button',{name:'Retirar publicación',exact:true})).toBeVisible();expect((await page.request.get('/api/v1/publicaciones/'+propia.id)).status()).toBe(200);
 await page.goto('/publicar');await page.getByRole('form',{name:'Editor de oferta'}).getByRole('combobox',{name:'Tipo',exact:true}).selectOption('servicio');await editor.getByLabel('Título',{exact:true}).fill('Gasfitería '+sufijo.slice(0,8));await editor.getByLabel('Descripción',{exact:true}).fill('Reparación y mantenimiento de tuberías con evaluación previa del alcance.');await editor.getByRole('button',{name:'Publicar oferta',exact:true}).click();await expect(page.getByRole('status')).toContainText('se guardó');
 const servicio=(await (await page.request.get('/api/v1/publicaciones/mias')).json()).items.find((p:any)=>p.tipo==='servicio');expect(servicio.tarifaCentimos).toBeNull();await page.goto('/publicaciones/'+servicio.id);await expect(page.locator('.detail-price')).toContainText('Precio a cotizar');
 }finally{await admin.close();}
});
