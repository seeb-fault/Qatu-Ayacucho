import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
test('avisos: el proveedor ve la campana, abre la solicitud y el cliente recibe la respuesta',async({page,browser})=>{
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const clienteCtx=await browser.newContext({viewport:{width:360,height:800}});
  try {
    await page.goto('/');
    await expect(page.locator('header').getByRole('link',{name:/^Avisos/})).toHaveCount(0);
    expect((await page.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.proveedorEmail,password:f.password}})).status()).toBe(200);
    expect((await clienteCtx.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.clienteEmail,password:f.password}})).status()).toBe(200);
    const desde=Date.now()+3*86400000;
    const creada=await clienteCtx.request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+3600000).toISOString(),descripcionTrabajo:'Instalar luminarias y revisar tomacorrientes en el domicilio.'}});
    expect(creada.status()).toBe(201);const s=await creada.json();

    // La entrega es asíncrona: el despachador real del backend corre cada pocos segundos.
    await expect(async()=>{await page.goto('/');await expect(page.locator('header').getByRole('link',{name:'Avisos, 1 sin leer',exact:true})).toBeVisible({timeout:2000});}).toPass({timeout:45000});
    await page.locator('header').getByRole('link',{name:'Avisos, 1 sin leer',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Avisos',exact:true})).toBeVisible();
    const aviso=page.getByRole('article',{name:'Recibiste una nueva solicitud.',exact:true});
    await expect(aviso).toContainText(f.titulo);await expect(aviso).toContainText('Sin leer');
    await aviso.getByRole('link',{name:'Ver la solicitud',exact:true}).click();
    await expect(page).toHaveURL(/\/reservas\?vista=proveedor$/);
    await expect(page.getByRole('button',{name:'Recibidas',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('article',{name:f.titulo,exact:true})).toBeVisible();
    await expect(page.locator('header').getByRole('link',{name:'Avisos',exact:true})).toBeVisible();
    await page.goto('/avisos');await expect(page.getByRole('status').filter({hasText:'No tienes avisos sin leer.'})).toBeVisible();
    await expect(page.getByRole('article',{name:'Recibiste una nueva solicitud.',exact:true})).not.toContainText('Sin leer');

    expect((await page.request.post(origin+'/api/v1/reservas/'+s.id+'/rechazo',{headers:{Origin:origin},data:{versionActual:s.version,motivo:'No hay disponibilidad para ese horario.'}})).status()).toBe(201);
    const otra=await clienteCtx.newPage();
    await expect(async()=>{await otra.goto(origin+'/avisos');await expect(otra.getByRole('article',{name:'El proveedor rechazó tu solicitud.',exact:true})).toBeVisible({timeout:2000});}).toPass({timeout:45000});
    await expect(otra.locator('header').getByRole('link',{name:'Avisos, 1 sin leer',exact:true})).toBeVisible();
    expect(await otra.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await otra.screenshot({path:'test-results/avisos-360.png'});
    await otra.getByRole('button',{name:'Marcar todos como leídos',exact:true}).click();
    await expect(otra.getByRole('status').filter({hasText:'No tienes avisos sin leer.'})).toBeVisible();
    await expect(otra.locator('header').getByRole('link',{name:'Avisos',exact:true})).toBeVisible();
    await otra.reload();await expect(otra.getByRole('article',{name:'El proveedor rechazó tu solicitud.',exact:true})).not.toContainText('Sin leer');
    await page.screenshot({path:'test-results/avisos-escritorio.png'});
  } finally {await clienteCtx.close();}
});
