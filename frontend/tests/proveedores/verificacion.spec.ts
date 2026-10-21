import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=','base64');

test('proveedor envía adjunto privado y administrador aprueba con historial', async ({ page,browser }) => {
  const sufijo = crypto.randomUUID();
  const email = `documentos-web-${sufijo}@example.com`;
  const emailAdmin = `revisor-web-${sufijo}@example.com`;
  const nombrePublico = `Taller documental ${sufijo.slice(0,8)}`;
  const password = 'frase de prueba documental de navegador';
  execFileSync(process.execPath,['--env-file-if-exists=.env','--import','tsx','scripts/aprovisionar-admin.ts'],{
    cwd: resolve('../backend'),stdio: 'pipe',env: { ...process.env,QATU_ADMIN_EMAIL: emailAdmin,QATU_ADMIN_NOMBRE: 'Revisor web',QATU_ADMIN_PASSWORD: password,QATU_ADMIN_MOTIVO: 'Preparación de verificación documental de prueba' },
  });
  expect((await page.request.post('/api/v1/auth/registro',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { email,password,nombre: 'Solicitante web' } })).status()).toBe(201);
  expect((await page.request.post('/api/v1/proveedores/me',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { nombrePublico,descripcion: 'Actividad de mantenimiento y herramientas para proyectos locales.',zonaId: 'ayacucho',visiblePublicamente: true } })).status()).toBe(201);
  await page.goto('/proveedor');
  await page.getByLabel('Documentos privados',{ exact: true }).setInputFiles({ name: 'documento-sintetico.png',mimeType: 'image/png',buffer: png });
  await page.getByRole('checkbox',{ name: 'Acepto la política de conservación indicada.' }).check();
  await page.getByRole('button',{ name: 'Solicitar verificación',exact: true }).click();
  await expect(page.getByText('En revisión documental',{ exact: true })).toBeVisible();
  const privado = page.getByRole('link',{ name: 'Descargar documento 1',exact: true });
  await expect(privado).toBeVisible();
  const archivoRuta = (await privado.getAttribute('href'))!;
  const publicoRuta = (await page.getByRole('link',{ name: 'Ver mi página pública' }).getAttribute('href'))!;
  const admin = await browser.newContext({ baseURL: 'http://127.0.0.1:3100' });
  try {
    expect((await admin.request.get(archivoRuta)).status()).toBe(401);
    expect((await admin.request.post('/api/v1/auth/login',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { email: emailAdmin,password } })).status()).toBe(200);
    const revision = await admin.newPage();
    await revision.goto('/cuenta');
    await revision.getByRole('link',{ name: 'Revisar proveedores',exact: true }).click();
    const solicitud = revision.getByRole('article',{ name: nombrePublico,exact: true });
    await expect(solicitud).toBeVisible();
    const descarga = await admin.request.get(archivoRuta);
    expect(descarga.status()).toBe(200);
    expect(descarga.headers()['content-disposition']).toMatch(/^attachment;/);
    expect(await descarga.body()).toEqual(png);
    await solicitud.getByLabel('Decisión',{ exact: true }).selectOption('aprobada');
    await solicitud.getByLabel('Motivo de la revisión',{ exact: true }).fill('Documentación sintética revisada en ensayo funcional');
    await solicitud.getByRole('button',{ name: 'Registrar decisión' }).click();
    await expect(solicitud).toHaveCount(0);
    await revision.getByLabel('Estado de solicitudes',{ exact: true }).selectOption('aprobada');
    await expect(solicitud.getByText('Documentación sintética revisada en ensayo funcional',{ exact: true })).toBeVisible();
    await page.getByRole('button',{ name: 'Recargar perfil',exact: true }).click();
    await expect(page.getByText('Verificación documental aprobada',{ exact: true })).toBeVisible();
    await page.goto(publicoRuta);
    await expect(page.getByText('Verificación documental aprobada',{ exact: true })).toBeVisible();
    await expect(page.getByText(email,{ exact: true })).toHaveCount(0);
    await page.setViewportSize({ width: 360,height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/proveedor-verificado-360.png',fullPage: true });
  } finally { await admin.close(); }
});

test('cola documental rechaza navegación directa anónima y de cliente', async ({ page }) => {
  await page.goto('/admin/proveedores');
  await expect(page.getByRole('link',{ name: 'Ingresar para revisar proveedores' })).toBeVisible();
  expect((await page.request.post('/api/v1/auth/registro',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { email: `cliente-cola-${crypto.randomUUID()}@example.com`,nombre: 'Cliente sin revisión',password: 'frase de prueba para acceso a cola' } })).status()).toBe(201);
  await page.reload();
  await expect(page.getByRole('region',{ name: 'Revisar proveedores',exact: true }).getByRole('alert')).toContainText('requiere una cuenta administrativa');
  await expect(page.getByRole('article')).toHaveCount(0);
});
