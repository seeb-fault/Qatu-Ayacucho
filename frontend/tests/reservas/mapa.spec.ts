import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', DIA = 86_400_000;
const PLAZA = { lat: -13.160227, lng: -74.225762 };
const backend = (script: string, ...args: string[]) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script, ...args], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });

test('mapa: zona casi exacta para el público y punto exacto tras la aceptación', async ({ page, browser }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const proveedor = await browser.newContext({ baseURL: origin });
  // Los mosaicos de OpenStreetMap no hacen falta para la prueba: no salir a internet.
  for (const ctx of [page.context(), proveedor]) await ctx.route('https://tile.openstreetmap.org/**', r => r.fulfill({ status: 204 }));
  try {
    for (const [ctx, email] of [[page.context(), f.clienteEmail], [proveedor, f.proveedorEmail]] as const)
      expect((await ctx.request.post(origin + '/api/v1/auth/login', { headers: { Origin: origin }, data: { email, password: f.password } })).status()).toBe(200);
    expect((await proveedor.request.put(origin + '/api/v1/publicaciones/' + f.publicacionId + '/ubicacion', { headers: { Origin: origin }, data: { ...PLAZA, precision: 'aproximada' } })).status()).toBe(200);

    // Público: mapa con zona de 100 m y aviso; sin el punto exacto en la página.
    await page.goto('/publicaciones/' + f.publicacionId);
    const seccion = page.getByRole('region', { name: 'Ubicación' }).or(page.locator('section[aria-labelledby="titulo-ubicacion"]')).first();
    await expect(seccion).toContainText('a menos de 100 m');
    await expect(page.locator('.leaflet-container')).toHaveCount(1);
    expect(await page.content()).not.toContain(String(PLAZA.lat));

    await page.goto('/buscar?q=' + encodeURIComponent(f.titulo));
    await page.getByRole('button', { name: /Ver en el mapa/ }).click();
    await expect(page.locator('.q-mapa-resultados .leaflet-container')).toBeVisible();

    // Tras la aceptación, el cliente ve el punto exacto y el enlace a Google Maps.
    const desde = Date.now() + 4 * DIA;
    const s = await (await page.request.post(origin + '/api/v1/reservas', { headers: { Origin: origin }, data: { publicacionId: f.publicacionId, recursoId: f.recursoId,
      inicio: new Date(desde).toISOString(), fin: new Date(desde + DIA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 } })).json();
    expect((await proveedor.request.post(origin + '/api/v1/reservas/' + s.id + '/aceptacion', { headers: { Origin: origin }, data: { versionActual: s.version } })).status()).toBe(201);
    await page.goto('/reservas');
    const tarjeta = page.getByRole('article', { name: f.titulo, exact: true });
    await expect(tarjeta).toContainText('Punto exacto de recojo');
    await expect(tarjeta.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute('href', `https://www.google.com/maps/search/?api=1&query=${PLAZA.lat},${PLAZA.lng}`);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await proveedor.close(); }
});
