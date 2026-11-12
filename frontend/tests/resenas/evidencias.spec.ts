import { test, expect, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', api = origin + '/api/v1', HORA = 3_600_000;
const backend = (script: string) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });
const entrar = async (request: APIRequestContext, email: string, password: string) =>
  expect((await request.post(api + '/auth/login', { headers: { Origin: origin }, data: { email, password } })).status()).toBe(200);
/** PNG sintético: firma válida y bytes aleatorios. No contiene información real. */
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), randomBytes(256)]);

test('el cliente sube una foto de entrega, la ve en su reserva y la descarga intacta; un PDF se rechaza', async ({ page, browser }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const proveedor = await browser.newContext();
  try {
    await entrar(page.request, f.clienteEmail, f.password); await entrar(proveedor.request, f.proveedorEmail, f.password);
    const desde = Date.now() + 96 * HORA;
    const creada = await page.request.post(api + '/reservas', { headers: { Origin: origin }, data: { publicacionId: f.publicacionId, recursoId: f.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 } });
    expect(creada.status()).toBe(201);
    let s = await creada.json();
    for (const [accion, quien] of [['aceptacion', proveedor.request], ['efectivo', proveedor.request], ['recepcion', page.request]] as const) {
      const r = await quien.post(`${api}/reservas/${s.id}/${accion}`, { headers: { Origin: origin }, data: { versionActual: s.version } });
      expect(r.status(), accion).toBe(201); s = await r.json();
    }
    expect(s.estado).toBe('EN_CURSO');

    await page.goto('/reservas');
    const tarjeta = page.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Alquiler en curso' });
    const seccion = tarjeta.getByRole('region', { name: 'Evidencias de la operación' });
    await expect(seccion).toContainText('Entrega · 0 de 4');
    const formulario = seccion.getByRole('form', { name: 'Subir evidencias' });

    await formulario.getByLabel(/Fotos de entrega/).setInputFiles({ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
    await formulario.getByRole('button', { name: 'Subir fotos' }).click();
    await expect(formulario.getByRole('alert')).toContainText('Solo se admiten fotos JPG o PNG');

    await formulario.getByLabel(/Fotos de entrega/).setInputFiles({ name: 'entrega.png', mimeType: 'image/png', buffer: png });
    await formulario.getByRole('button', { name: 'Subir fotos' }).click();
    await expect(seccion).toContainText('Entrega · 1 de 4');
    const enlace = seccion.getByRole('link', { name: 'Foto de el cliente' });
    await expect(enlace).toBeVisible();

    const descarga = await page.request.get(origin + (await enlace.getAttribute('href'))!);
    expect(descarga.status()).toBe(200);
    expect(descarga.headers()['content-disposition']).toMatch(/^attachment/);
    expect(Buffer.from(await descarga.body()).equals(png)).toBe(true);

    // El proveedor también la ve; un tercero sin sesión no puede descargarla.
    const vista = await proveedor.newPage();
    await vista.goto('/reservas?vista=proveedor');
    await vista.getByRole('button', { name: 'Recibidas' }).click();
    await expect(vista.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Alquiler en curso' }).getByRole('link', { name: 'Foto de el cliente' })).toBeVisible();
    const anonimo = await browser.newContext();
    expect((await anonimo.request.get(origin + (await enlace.getAttribute('href'))!)).status()).toBe(401);
    await anonimo.close();

    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  } finally { await proveedor.close(); }
});
