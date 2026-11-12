import { test, expect, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', api = origin + '/api/v1', HORA = 3_600_000;
const backend = (script: string) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });
const entrar = async (request: APIRequestContext, email: string, password: string) =>
  expect((await request.post(api + '/auth/login', { headers: { Origin: origin }, data: { email, password } })).status()).toBe(200);

test('el cliente reseña una herramienta devuelta y la calificación llega al perfil público y al catálogo', async ({ page, browser }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const proveedor = await browser.newContext();
  try {
    await entrar(page.request, f.clienteEmail, f.password); await entrar(proveedor.request, f.proveedorEmail, f.password);
    // Operación completa por API: solicitud, aceptación, efectivo, recepción y devolución confirmada.
    const desde = Date.now() + 72 * HORA;
    const creada = await page.request.post(api + '/reservas', { headers: { Origin: origin }, data: { publicacionId: f.publicacionId, recursoId: f.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 } });
    expect(creada.status()).toBe(201);
    let s = await creada.json();
    for (const [accion, quien] of [['aceptacion', proveedor.request], ['efectivo', proveedor.request], ['recepcion', page.request], ['devolucion/aviso', page.request], ['devolucion/confirmacion', proveedor.request]] as const) {
      const r = await quien.post(`${api}/reservas/${s.id}/${accion}`, { headers: { Origin: origin }, data: { versionActual: s.version } });
      expect(r.status(), accion).toBe(201); s = await r.json();
    }
    expect(s.estado).toBe('DEVUELTA');

    await page.goto('/reservas');
    const tarjeta = page.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Herramienta devuelta' });
    const formulario = tarjeta.getByRole('form', { name: 'Calificar esta operación' });
    await expect(formulario).toBeVisible();
    await formulario.getByRole('button', { name: 'Publicar reseña' }).click();
    await expect(formulario.getByRole('alert')).toContainText('Elige de 1 a 5 estrellas.');
    await formulario.getByLabel('4 estrellas: Buena').check({ force: true });
    await formulario.getByLabel('Comentario (opcional)').fill('Taladro en buen estado y entrega puntual.');
    await formulario.getByRole('button', { name: 'Publicar reseña' }).click();
    await expect(tarjeta.getByText('Tu reseña')).toBeVisible();
    await expect(tarjeta.getByLabel('4 de 5 estrellas')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Herramienta devuelta' }).getByText('Taladro en buen estado y entrega puntual.')).toBeVisible();

    // El proveedor ve la reseña, pero no puede escribir una.
    const vista = await proveedor.newPage();
    await vista.goto('/reservas?vista=proveedor');
    await vista.getByRole('button', { name: 'Recibidas' }).click();
    const recibida = vista.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Herramienta devuelta' });
    await expect(recibida.getByText('Reseña del cliente')).toBeVisible();
    await expect(recibida.getByRole('form', { name: 'Calificar esta operación' })).toHaveCount(0);

    const proveedorId = (await (await page.request.get(`${api}/publicaciones/${f.publicacionId}`)).json()).proveedor.id;
    await page.goto(`/proveedores/${proveedorId}`);
    const seccion = page.getByRole('region', { name: 'Reseñas de clientes' });
    await expect(seccion).toContainText('4.0');
    await expect(seccion).toContainText('1 reseña');
    await expect(seccion).toContainText('Taladro en buen estado y entrega puntual.');

    await page.goto('/buscar?q=' + encodeURIComponent(f.titulo));
    await expect(page.locator('.offer-card').filter({ hasText: f.titulo }).locator('.rating')).toContainText('4.0');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/proveedores/${proveedorId}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  } finally { await proveedor.close(); }
});
