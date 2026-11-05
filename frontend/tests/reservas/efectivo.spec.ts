import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
function preparar() {
  return JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts'],{
    cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'},
  }));
}
async function fechas(page:Page) {
  const inicio=new Date(Date.now()+86400000).toISOString().slice(0,16),fin=new Date(Date.now()+2*86400000).toISOString().slice(0,16);
  await page.getByLabel('Inicio (hora de Lima)',{exact:true}).fill(inicio);await page.getByLabel('Fin (hora de Lima)',{exact:true}).fill(fin);
}
test('alquiler con efectivo: apartado, entrega, confirmación bilateral y devolución real',async({page,browser})=>{
  const f=preparar();
  expect((await page.request.post('/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.clienteEmail,password:f.password}})).status()).toBe(200);
  await page.goto('/reservas/nueva?publicacion='+f.publicacionId);await fechas(page);
  await expect(page.getByLabel('Condiciones del alquiler')).toContainText('42.50');
  await page.getByRole('button',{name:'Consultar disponibilidad',exact:true}).click();await expect(page.getByRole('status')).toContainText('No hay apartados');
  await page.getByLabel('Acepto el horario, el importe y las condiciones de alquiler',{exact:true}).check();
  await page.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await expect(page.getByRole('heading',{name:'Solicitud enviada'})).toBeVisible();
  await page.getByRole('link',{name:'Ir a mis solicitudes',exact:true}).click();
  const enviada=page.getByRole('article',{name:f.titulo,exact:true});await expect(enviada).toContainText('Pendiente de respuesta');
  await expect(enviada.getByRole('link',{name:'Compartir coordinación por WhatsApp'})).toHaveAttribute('href',/^https:\/\/wa\.me\/\?text=/);
  const contexto=await browser.newContext({viewport:{width:360,height:900}});
  try {
    expect((await contexto.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.proveedorEmail,password:f.password}})).status()).toBe(200);
    const proveedor=await contexto.newPage();await proveedor.goto(origin+'/reservas');await proveedor.getByRole('button',{name:'Recibidas',exact:true}).click();
    const recibida=proveedor.getByRole('article',{name:f.titulo,exact:true});
    await recibida.getByRole('button',{name:'Aceptar y apartar 60 minutos',exact:true}).click();await expect(recibida).toContainText('Acércate antes de:');
    await page.getByRole('button',{name:'Actualizar',exact:true}).click();await expect(enviada).toContainText('Herramienta apartada');
    const registro=recibida.getByRole('form',{name:'Registrar efectivo y entrega',exact:true});await registro.getByRole('checkbox').check();await registro.getByRole('button',{name:'Registrar efectivo y entrega',exact:true}).click();
    await expect(recibida).toContainText('Falta la confirmación del cliente');
    await page.getByRole('button',{name:'Actualizar',exact:true}).click();
    const recepcion=enviada.getByRole('form',{name:'Confirmar recepción',exact:true});await recepcion.getByRole('checkbox').check();await recepcion.getByRole('button',{name:'Confirmar pago y recepción',exact:true}).click();
    await expect(enviada).toContainText('Alquiler en curso');await expect(enviada).toContainText('Efectivo inicial confirmado por ambos participantes');
    const aviso=enviada.getByRole('form',{name:'Avisar devolución',exact:true});await aviso.getByRole('checkbox').check();await aviso.getByRole('button',{name:'Avisar devolución',exact:true}).click();
    await expect(enviada).toContainText('Devolución pendiente de confirmación');
    await proveedor.getByRole('button',{name:'Actualizar',exact:true}).click();
    const devolucion=recibida.getByRole('form',{name:'Confirmar devolución',exact:true});await devolucion.getByRole('checkbox').check();await devolucion.getByRole('button',{name:'Confirmar devolución',exact:true}).click();
    await expect(recibida).toContainText('Herramienta devuelta');await expect(recibida).toContainText('Sin saldo adicional');
    expect(await proveedor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await proveedor.screenshot({path:'test-results/reservas-efectivo-360.png',fullPage:true});
    await page.reload();await expect(enviada).toContainText('Herramienta devuelta');
    const leida=await (await page.request.get('/api/v1/reservas')).json();expect(leida.items[0].pagoEstado).toBe('CONFIRMADO_PARTICIPANTES');expect(leida.items[0].efectivoCentimos).toBe(4250);expect(leida.items[0].saldoCentimos).toBe(0);
  }finally{await contexto.close();}
});

test('visita previa: acuerdo sin bloqueo, sin efectivo y nueva solicitud de alquiler explícita',async({page,browser})=>{
  const f=preparar();
  expect((await page.request.post('/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.clienteEmail,password:f.password}})).status()).toBe(200);
  await page.goto('/reservas/nueva?publicacion='+f.publicacionId);await page.getByRole('combobox',{name:'Qué necesitas',exact:true}).selectOption('visita');await fechas(page);
  await expect(page.getByLabel('Condiciones del alquiler')).toHaveCount(0);
  await page.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await expect(page.getByRole('heading',{name:'Solicitud enviada'})).toBeVisible();
  const contexto=await browser.newContext();
  try{
    expect((await contexto.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.proveedorEmail,password:f.password}})).status()).toBe(200);
    const proveedor=await contexto.newPage();await proveedor.goto(origin+'/reservas');await proveedor.getByRole('button',{name:'Recibidas',exact:true}).click();
    const recibida=proveedor.getByRole('article',{name:f.titulo,exact:true});await recibida.getByLabel('Indicaciones para la visita',{exact:true}).fill('Coordinemos la llegada para revisar la herramienta en el taller.');
    await recibida.getByRole('button',{name:'Acordar visita sin apartar',exact:true}).click();await expect(recibida).toContainText('Visita acordada');
    await expect(recibida.getByRole('button',{name:'Registrar efectivo y entrega'})).toHaveCount(0);
    await page.goto('/reservas');const enviada=page.getByRole('article',{name:f.titulo,exact:true});await expect(enviada).toContainText('Visita acordada');
    await expect(enviada.getByRole('link',{name:'Hacer una nueva solicitud de esta oferta'})).toBeVisible();
    const lista=await (await page.request.get('/api/v1/reservas')).json(),s=lista.items[0];
    expect(s.condiciones).toBeNull();expect(s.venceEn).toBeNull();expect(s.efectivoCentimos).toBe(0);
    const q=new URLSearchParams({publicacionId:s.publicacionId,inicio:s.inicio,fin:s.fin});
    const disponibilidad=await (await page.request.get('/api/v1/recursos/'+s.recursoId+'/disponibilidad?'+q)).json();expect(disponibilidad.franjas).toHaveLength(0);
  }finally{await contexto.close();}
});
