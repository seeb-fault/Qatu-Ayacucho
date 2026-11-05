import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
const backend=(script:string,...args:string[])=>execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx',script,...args],{cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}});

test('oficio: inicio, término rechazado, término confirmado con efectivo y cierre persistido',async({page,browser})=>{
  const f=JSON.parse(backend('test/reservas/fixture-e2e.ts','--servicio'));
  const clienteCtx=await browser.newContext({viewport:{width:360,height:900}});
  try {
    expect((await page.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.proveedorEmail,password:f.password}})).status()).toBe(200);
    expect((await clienteCtx.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.clienteEmail,password:f.password}})).status()).toBe(200);
    const desde=Date.now()+3*86400000;
    const a=await clienteCtx.request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+3600000).toISOString(),descripcionTrabajo:'Instalar luminarias y revisar tomacorrientes en el domicilio.'}});
    expect(a.status()).toBe(201);const s=await a.json();
    const b=await page.request.post(origin+'/api/v1/reservas/'+s.id+'/cotizacion',{headers:{Origin:origin},data:{versionActual:s.version,alcance:'Instalar luminarias y revisar tomacorrientes en el domicilio.',materiales:'Solo mano de obra; materiales del cliente.',importeCentimos:18050,vigenteHasta:new Date(Date.now()+86400000).toISOString()}});
    expect(b.status()).toBe(201);const p=await b.json();
    expect((await clienteCtx.request.post(origin+'/api/v1/reservas/'+s.id+'/cotizacion/aceptacion',{headers:{Origin:origin},data:{versionActual:p.version,versionCotizacion:1}})).status()).toBe(201);

    const abrirProveedor=async()=>{await page.goto('/reservas');await page.getByRole('button',{name:'Recibidas',exact:true}).click();return page.getByRole('article',{name:f.titulo,exact:true});};
    let tarjeta=await abrirProveedor();
    await expect(tarjeta).toContainText('Podrás registrar el inicio del trabajo desde la hora acordada');
    await expect(tarjeta.getByRole('button',{name:'Registrar inicio del trabajo',exact:true})).toHaveCount(0);

    backend('test/reservas/adelantar-horario-e2e.ts',s.id);
    tarjeta=await abrirProveedor();
    await tarjeta.getByRole('form',{name:'Registrar inicio del trabajo',exact:true}).getByRole('checkbox').check();
    await tarjeta.getByRole('button',{name:'Registrar inicio del trabajo',exact:true}).click();
    await expect(tarjeta).toContainText('Trabajo en curso');
    await tarjeta.getByRole('form',{name:'Declarar trabajo terminado',exact:true}).getByRole('checkbox').check();
    await tarjeta.getByRole('button',{name:'Declarar trabajo terminado',exact:true}).click();
    await expect(tarjeta).toContainText('Término pendiente de confirmación');

    const otra=await clienteCtx.newPage();await otra.goto(origin+'/reservas');
    const cliente=otra.getByRole('article',{name:f.titulo,exact:true});
    await expect(cliente).toContainText('Falta la confirmación del cliente');
    await cliente.getByText('El trabajo aún no terminó',{exact:true}).click();
    await cliente.getByLabel('Motivo para rechazar el término',{exact:true}).fill('Faltó instalar dos luminarias del alcance acordado.');
    await cliente.getByRole('button',{name:'Rechazar término',exact:true}).click();
    await expect(cliente).toContainText('Trabajo en curso');
    await expect(cliente).toContainText('Faltó instalar dos luminarias');

    tarjeta=await abrirProveedor();
    await tarjeta.getByRole('form',{name:'Declarar trabajo terminado',exact:true}).getByRole('checkbox').check();
    await tarjeta.getByRole('button',{name:'Declarar trabajo terminado',exact:true}).click();
    await expect(tarjeta).toContainText('Término pendiente de confirmación');

    await otra.reload();
    await cliente.getByRole('form',{name:'Confirmar trabajo y pago',exact:true}).getByRole('checkbox').check();
    await cliente.getByRole('button',{name:'Confirmar trabajo y pago',exact:true}).click();
    await expect(cliente).toContainText('Servicio cerrado');
    await otra.reload();
    await expect(cliente).toContainText('Trabajo cerrado por ambos participantes');
    await expect(cliente).toContainText('Efectivo confirmado por ambos participantes');
    await expect(cliente).not.toContainText('días adicionales');

    const guardada=await (await clienteCtx.request.get(origin+'/api/v1/reservas/'+s.id)).json();
    expect(guardada.estado).toBe('SERVICIO_CERRADO');expect(guardada.pagoEstado).toBe('CONFIRMADO_PARTICIPANTES');expect(guardada.efectivoCentimos).toBe(18050);expect(guardada.importeFinalCentimos).toBe(18050);
    expect(await otra.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await otra.screenshot({path:'test-results/servicio-cerrado-360.png',fullPage:true});
  } finally {await clienteCtx.close();}
});
