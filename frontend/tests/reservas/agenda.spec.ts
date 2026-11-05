import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
test('agenda de oficio: conflicto visible, cancelación y confirmación del segundo cliente sin anticipo',async({page,browser})=>{
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts','--servicio'],{cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  const segundo=await browser.newContext({viewport:{width:360,height:900}}),proveedor=await browser.newContext();
  try {
    for(const [request,email] of [[page.request,f.clienteEmail],[segundo.request,f.clienteBEmail],[proveedor.request,f.proveedorEmail]] as const) {
      expect((await request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email,password:f.password}})).status()).toBe(200);
    }
    const inicio=new Date(Date.now()+3*86400000).toISOString(),fin=new Date(Date.now()+3*86400000+3600000).toISOString();
    for(const request of [page.request,segundo.request]) {
      const r=await request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio,fin,descripcionTrabajo:'Instalar luminarias y revisar tomacorrientes en el domicilio.'}});
      expect(r.status()).toBe(201);const s=await r.json();
      expect((await proveedor.request.post(origin+'/api/v1/reservas/'+s.id+'/cotizacion',{headers:{Origin:origin},data:{versionActual:s.version,alcance:'Instalar luminarias y revisar tomacorrientes en el domicilio.',materiales:'Solo mano de obra; materiales del cliente.',importeCentimos:18050,vigenteHasta:new Date(Date.now()+86400000).toISOString()}})).status()).toBe(201);
    }
    const otra=await segundo.newPage();await page.goto('/reservas');await otra.goto(origin+'/reservas');
    const a=page.getByRole('article',{name:f.titulo,exact:true}),b=otra.getByRole('article',{name:f.titulo,exact:true});
    await a.getByRole('form',{name:'Aceptar cotización',exact:true}).getByRole('checkbox').check();
    await a.getByRole('button',{name:'Aceptar cotización',exact:true}).click();await expect(a).toContainText('Servicio confirmado');
    await b.getByRole('form',{name:'Aceptar cotización',exact:true}).getByRole('checkbox').check();
    await b.getByRole('button',{name:'Aceptar cotización',exact:true}).click();
    const conflicto=otra.getByRole('alert').filter({hasText:'agenda ya está reservada'});
    await expect(conflicto).toBeVisible();
    await expect(b).toContainText('Pendiente de respuesta');
    await a.getByText('Cancelar servicio',{exact:true}).click();
    await a.getByLabel('Motivo de cancelación',{exact:true}).fill('Cambio de planes comunicado antes de iniciar el trabajo.');
    await a.getByRole('button',{name:'Confirmar cancelación',exact:true}).click();await expect(a).toContainText('Cancelada');
    await b.getByRole('button',{name:'Aceptar cotización',exact:true}).click();await expect(b).toContainText('Servicio confirmado');
    await expect(conflicto).toHaveCount(0);
    await otra.reload();await expect(b).toContainText('Horario reservado para esta agenda');
    const s=(await (await segundo.request.get(origin+'/api/v1/reservas')).json()).items[0];
    expect(s.estado).toBe('SERVICIO_CONFIRMADO');expect(s.pagoEstado).toBe('PENDIENTE');expect(s.efectivoCentimos).toBe(0);expect(s.venceEn).toBeNull();
    expect(s.cotizaciones[0].respuesta.decision).toBe('ACEPTADA');
    const q=new URLSearchParams({publicacionId:f.publicacionId,inicio,fin});
    const disponibilidad=await (await segundo.request.get(origin+'/api/v1/recursos/'+f.recursoId+'/disponibilidad?'+q)).json();expect(disponibilidad.franjas).toHaveLength(1);
    expect(await otra.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await otra.screenshot({path:'test-results/agenda-servicio-360.png',fullPage:true});
  } finally {await segundo.close();await proveedor.close();}
});
