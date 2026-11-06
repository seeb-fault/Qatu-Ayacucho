import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
test('un fallo del proxy se reintenta solo en lecturas: la bandeja se recupera y una escritura nunca se repite',async({page})=>{
  const f=JSON.parse(execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','test/reservas/fixture-e2e.ts'],{cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}}));
  expect((await page.request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email:f.clienteEmail,password:f.password}})).status()).toBe(200);
  const desde=Date.now()+3*86400000;
  const creada=await page.request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+86400000).toISOString(),aceptaCondiciones:true,tarifaEsperadaCentimos:4250}});
  expect(creada.status()).toBe(201);

  let lecturas=0;
  await page.route('**/api/v1/reservas?*',async ruta=>{lecturas++;if(lecturas===1)await ruta.fulfill({status:500,body:'Internal Server Error'});else await ruta.continue();});
  await page.goto('/reservas');
  const tarjeta=page.getByRole('article',{name:f.titulo,exact:true});
  await expect(tarjeta).toContainText('Pendiente de respuesta');
  expect(lecturas).toBe(2);
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);

  // Un error propio del backend (503) no se reintenta: ya lo evaluó el servidor.
  let conError=0;
  await page.unroute('**/api/v1/reservas?*');
  await page.route('**/api/v1/reservas?*',ruta=>{conError++;return ruta.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'SERVICIO_NO_DISPONIBLE',mensaje:'El servicio no está disponible. Intenta nuevamente.'})});});
  await page.reload();
  await expect(page.getByRole('main').getByRole('alert').first()).toContainText('no está disponible');
  expect(conError).toBe(1);
  await page.unroute('**/api/v1/reservas?*');

  await page.reload();await expect(tarjeta).toContainText('Pendiente de respuesta');
  let escrituras=0;
  await page.route('**/api/v1/reservas/*/cancelacion',ruta=>{escrituras++;return ruta.fulfill({status:500,body:'Internal Server Error'});});
  await tarjeta.getByText('Cancelar solicitud',{exact:true}).click();
  await tarjeta.getByLabel('Motivo de cancelación',{exact:true}).fill('Prueba de que una escritura no se reintenta.');
  await tarjeta.getByRole('button',{name:'Confirmar cancelación',exact:true}).click();
  await expect(page.getByRole('main').getByRole('alert').first()).toBeVisible();
  expect(escrituras).toBe(1);
});
