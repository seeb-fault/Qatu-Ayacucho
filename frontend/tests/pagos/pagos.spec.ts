import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin='http://127.0.0.1:3100';
const backend=(script:string,...args:string[])=>execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx',script,...args],{cwd:resolve('../backend'),encoding:'utf8',env:{...process.env,QATU_E2E_RESERVAS:'1'}});
// Sustituye el checkout externo: el navegador recibe un token de prueba sin salir a internet.
const checkoutDoble=`window.CulqiCheckout=class{constructor(l,c){window.__checkout={llave:l,config:c};}open(){this.token={id:window.__tokenPrueba||'tkn_test_e2e'};this.culqi();}close(){}}`;
const prepararCheckout=async(contexto:BrowserContext|Page,token:string)=>{
  await contexto.route('https://js.culqi.com/checkout-js',r=>r.fulfill({contentType:'text/javascript',body:checkoutDoble}));
  await contexto.addInitScript(t=>{(window as unknown as {__tokenPrueba:string}).__tokenPrueba=t;},token);
};
const entrar=async(request:BrowserContext['request'],email:string,password:string)=>expect((await request.post(origin+'/api/v1/auth/login',{headers:{Origin:origin},data:{email,password}})).status()).toBe(200);

test('herramienta: rechazo sin cobro, pago en línea y entrega confirmada',async({page,browser})=>{
  const f=JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const proveedorCtx=await browser.newContext();
  try {
    await entrar(page.request,f.clienteEmail,f.password);await entrar(proveedorCtx.request,f.proveedorEmail,f.password);
    await prepararCheckout(page,'tkn_test_rechaza_e2e');
    const desde=Date.now()+3*86400000;
    const creada=await page.request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+86400000).toISOString(),aceptaCondiciones:true,tarifaEsperadaCentimos:4250}});
    expect(creada.status()).toBe(201);const s=await creada.json();
    expect((await proveedorCtx.request.post(origin+'/api/v1/reservas/'+s.id+'/aceptacion',{headers:{Origin:origin},data:{versionActual:s.version}})).status()).toBe(201);

    await page.goto('/reservas');
    const tarjeta=page.getByRole('article',{name:f.titulo,exact:true});
    await expect(tarjeta.getByLabel('Pago en línea')).toContainText('no se realizan cobros reales');
    const pagar=tarjeta.getByRole('button',{name:/^Pagar .* en línea$/});
    await pagar.click();
    await expect(page.getByRole('article',{name:f.titulo,exact:true})).toContainText('no se hizo ningún cobro');
    await expect(page.getByRole('article',{name:f.titulo,exact:true})).toContainText('Herramienta apartada');
    const config=await page.evaluate(()=>(window as unknown as {__checkout:{llave:string;config:{settings:{amount:number;currency:string};options:{paymentMethods:Record<string,boolean>}}}}).__checkout);
    expect(config.llave).toBe('pk_test_doble');expect(config.config.settings.amount).toBe(4250);expect(config.config.settings.currency).toBe('PEN');expect(config.config.options.paymentMethods.tarjeta).toBe(true);expect(config.config.options.paymentMethods.yape).toBe(false);

    await page.evaluate(()=>{(window as unknown as {__tokenPrueba:string}).__tokenPrueba='tkn_test_bueno_e2e';});
    await tarjeta.getByRole('button',{name:/^Pagar .* en línea$/}).click();
    await expect(tarjeta).toContainText('Herramienta apartada y pagada');
    await expect(tarjeta).toContainText('Modo de prueba, sin cobro real');
    await expect(tarjeta.getByRole('button',{name:/^Pagar .* en línea$/})).toHaveCount(0);
    const pagada=await (await page.request.get(origin+'/api/v1/reservas/'+s.id)).json();
    expect(pagada.pagoEstado).toBe('PAGADO_EN_LINEA');expect(pagada.pagadoEnLineaCentimos).toBe(4250);expect(pagada.efectivoCentimos).toBe(0);expect(pagada.venceEn).toBeNull();

    const proveedor=await proveedorCtx.newPage();
    await proveedor.goto(origin+'/reservas?vista=proveedor');
    const recibida=proveedor.getByRole('article',{name:f.titulo,exact:true});
    await expect(recibida).toContainText('Pagado en línea');
    await expect(recibida.getByRole('button',{name:'Registrar efectivo y entrega'})).toHaveCount(0);
    await recibida.getByRole('form',{name:'Registrar entrega',exact:true}).getByRole('checkbox').check();
    await recibida.getByRole('button',{name:'Registrar entrega',exact:true}).click();
    await expect(recibida).toContainText('Entrega pendiente de confirmación');

    await page.reload();
    const confirmar=tarjeta.getByRole('form',{name:'Confirmar recepción',exact:true});
    await confirmar.getByRole('checkbox').check();
    await tarjeta.getByRole('button',{name:'Confirmar pago y recepción',exact:true}).click();
    await expect(tarjeta).toContainText('Alquiler en curso');
  } finally {await proveedorCtx.close();}
});

test('oficio: resultado desconocido sin repetir el pago, y pago final que cierra en móvil',async({page,browser})=>{
  const f=JSON.parse(backend('test/reservas/fixture-e2e.ts','--servicio'));
  const clienteCtx=await browser.newContext({viewport:{width:360,height:800}});
  try {
    await entrar(page.request,f.proveedorEmail,f.password);await entrar(clienteCtx.request,f.clienteEmail,f.password);
    await prepararCheckout(clienteCtx,'tkn_test_e2e_oficio');
    const crear=async(dias:number)=>{
      const desde=Date.now()+dias*86400000;
      const a=await clienteCtx.request.post(origin+'/api/v1/reservas',{headers:{Origin:origin},data:{publicacionId:f.publicacionId,recursoId:f.recursoId,inicio:new Date(desde).toISOString(),fin:new Date(desde+3600000).toISOString(),descripcionTrabajo:'Instalar luminarias y revisar tomacorrientes en el domicilio.'}});
      expect(a.status()).toBe(201);const s=await a.json();
      const b=await page.request.post(origin+'/api/v1/reservas/'+s.id+'/cotizacion',{headers:{Origin:origin},data:{versionActual:s.version,alcance:'Instalar luminarias y revisar tomacorrientes en el domicilio.',materiales:'Solo mano de obra; materiales del cliente.',importeCentimos:18050,vigenteHasta:new Date(Date.now()+86400000).toISOString()}});
      expect(b.status()).toBe(201);const p=await b.json();
      expect((await clienteCtx.request.post(origin+'/api/v1/reservas/'+s.id+'/cotizacion/aceptacion',{headers:{Origin:origin},data:{versionActual:p.version,versionCotizacion:1}})).status()).toBe(201);
      backend('test/reservas/adelantar-horario-e2e.ts',s.id);
      return s.id as string;
    };
    const id=await crear(3);
    await page.goto('/reservas?vista=proveedor');
    const recibida=page.getByRole('article',{name:f.titulo,exact:true});
    await recibida.getByRole('form',{name:'Registrar inicio del trabajo',exact:true}).getByRole('checkbox').check();
    await recibida.getByRole('button',{name:'Registrar inicio del trabajo',exact:true}).click();
    await expect(recibida).toContainText('Trabajo en curso');
    await recibida.getByRole('form',{name:'Solicitar pago en línea',exact:true}).getByRole('checkbox').check();
    await recibida.getByRole('button',{name:'Solicitar pago en línea',exact:true}).click();
    await expect(recibida).toContainText('Trabajo terminado, pendiente de pago');

    const otra=await clienteCtx.newPage();await otra.goto(origin+'/reservas');
    const tarjeta=otra.getByRole('article',{name:f.titulo,exact:true});
    await expect(tarjeta.getByRole('button',{name:/^Pagar .*180\.50 en línea$/})).toBeVisible();
    expect(await otra.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await otra.screenshot({path:'test-results/pago-oficio-360.png'});
    await tarjeta.getByRole('button',{name:/^Pagar .* en línea$/}).click();
    await expect(tarjeta).toContainText('Servicio cerrado');
    await expect(tarjeta).toContainText('Pagado en línea');
    const cerrada=await (await clienteCtx.request.get(origin+'/api/v1/reservas/'+id)).json();
    expect(cerrada.estado).toBe('SERVICIO_CERRADO');expect(cerrada.pagadoEnLineaCentimos).toBe(18050);expect(cerrada.importeFinalCentimos).toBe(18050);

    // Un timeout de la pasarela no se presenta como rechazo y no ofrece volver a pagar.
    const dudosa=await crear(6);
    const v=(await (await page.request.get(origin+'/api/v1/reservas/'+dudosa)).json()).version;
    const iniciada=await (await page.request.post(origin+'/api/v1/reservas/'+dudosa+'/servicio/inicio',{headers:{Origin:origin},data:{versionActual:v}})).json();
    expect((await page.request.post(origin+'/api/v1/reservas/'+dudosa+'/servicio/cobro',{headers:{Origin:origin},data:{versionActual:iniciada.version}})).status()).toBe(201);
    const pago=await clienteCtx.request.post(origin+'/api/v1/reservas/'+dudosa+'/pagos',{headers:{Origin:origin,'Idempotency-Key':'e2e-'+dudosa},data:{tokenId:'tkn_test_timeout_e2e'}});
    expect(pago.status()).toBe(202);
    await otra.reload();
    await expect(otra.getByRole('status').filter({hasText:'Estamos confirmando el pago'})).toBeVisible();
    await expect(otra.getByText('No vuelvas a pagar',{exact:false})).toBeVisible();
    await expect(otra.getByRole('button',{name:/^Pagar .* en línea$/})).toHaveCount(0);
  } finally {await clienteCtx.close();}
});
