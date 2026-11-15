import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', DIA = 86_400_000;
const backend = (script: string, ...args: string[]) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script, ...args], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });

test('el WhatsApp del proveedor aparece recién cuando acepta, con el mensaje de la reserva', async ({ page, browser }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const proveedor = await browser.newContext({ baseURL: origin });
  try {
    for (const [ctx, email] of [[page.context(), f.clienteEmail], [proveedor, f.proveedorEmail]] as const)
      expect((await ctx.request.post(origin + '/api/v1/auth/login', { headers: { Origin: origin }, data: { email, password: f.password } })).status()).toBe(200);
    const desde = Date.now() + 4 * DIA;
    const s = await (await page.request.post(origin + '/api/v1/reservas', { headers: { Origin: origin }, data: { publicacionId: f.publicacionId, recursoId: f.recursoId,
      inicio: new Date(desde).toISOString(), fin: new Date(desde + DIA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 } })).json();

    await page.goto('/reservas');
    const tarjeta = page.getByRole('article', { name: f.titulo, exact: true });
    await expect(tarjeta).toContainText('Pendiente');
    await expect(tarjeta.getByRole('link', { name: /por WhatsApp$/ })).toHaveCount(0);

    expect((await proveedor.request.post(origin + '/api/v1/reservas/' + s.id + '/aceptacion', { headers: { Origin: origin }, data: { versionActual: s.version } })).status()).toBe(201);
    await page.reload();
    const enlace = tarjeta.getByRole('link', { name: /por WhatsApp$/ });
    await expect(enlace).toBeVisible();
    const href = decodeURIComponent((await enlace.getAttribute('href'))!);
    expect(href.startsWith('https://wa.me/51987654321?text=')).toBe(true);
    expect(href).toContain(f.titulo);
    await expect(enlace).toHaveAttribute('rel', /noopener/);
    await expect(tarjeta.getByLabel('Coordinar por WhatsApp')).toContainText('confirma en Qatu');
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await proveedor.close(); }
});
