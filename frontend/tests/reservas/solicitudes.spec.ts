import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100';
test('solicitud real: cliente solicita, proveedor rechaza y ambos ven el estado persistido', async ({ page, browser }) => {
  const fixture = JSON.parse(execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'test/reservas/fixture-e2e.ts'], {
    cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' },
  }));
  await page.goto('/reservas');
  await expect(page.getByRole('link', { name: 'Inicia sesión para consultar tus solicitudes' })).toBeVisible();
  const login = await page.request.post('/api/v1/auth/login', { headers: { Origin: origin }, data: { email: fixture.clienteEmail, password: fixture.password } });
  expect(login.status()).toBe(200);
  await page.goto('/publicaciones/' + fixture.publicacionId);
  await page.getByRole('link', { name: 'Solicitar reserva', exact: true }).click();
  await expect(page.getByRole('heading', { name: fixture.titulo, exact: true })).toBeVisible();
  const inicio = new Date(Date.now() + 3 * 86400000).toISOString().slice(0,16);
  const fin = new Date(Date.now() + 4 * 86400000).toISOString().slice(0,16);
  await page.getByLabel('Inicio (hora de Lima)', { exact: true }).fill(inicio);
  await page.getByLabel('Fin (hora de Lima)', { exact: true }).fill(fin);
  await page.getByLabel('Cuéntanos tu proyecto (opcional)').fill('Proyecto sintético de instalación de repisas en el hogar.');
  await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud enviada', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Ir a mis solicitudes', exact: true }).click();
  const solicitud = page.getByRole('article', { name: fixture.titulo, exact: true });
  await expect(solicitud).toContainText('Pendiente de respuesta');
  const lista = await (await page.request.get('/api/v1/reservas')).json();
  expect(lista.items[0].inicio).toBe(new Date(inicio + ':00-05:00').toISOString());
  expect(lista.items[0].snapshot.tarifaReferenciaCentimos).toBe(4250);
  expect(lista.items[0].snapshot.total).toBeUndefined();

  const contexto = await browser.newContext({ viewport: { width: 360, height: 900 } });
  try {
    const proveedor = await contexto.newPage();
    expect((await contexto.request.post(origin + '/api/v1/auth/login', { headers: { Origin: origin }, data: { email: fixture.proveedorEmail, password: fixture.password } })).status()).toBe(200);
    await proveedor.goto(origin + '/reservas');
    await proveedor.getByRole('button', { name: 'Recibidas', exact: true }).click();
    const recibida = proveedor.getByRole('article', { name: fixture.titulo, exact: true });
    await expect(recibida).toContainText('Pendiente de respuesta');
    await recibida.getByLabel('Motivo del rechazo', { exact: true }).fill('No puedo coordinar el retiro durante las fechas solicitadas.');
    await recibida.getByRole('button', { name: 'Rechazar solicitud', exact: true }).click();
    await expect(recibida).toContainText('Rechazada');
    await expect(recibida.getByRole('button', { name: 'Rechazar solicitud' })).toHaveCount(0);
    expect(await proveedor.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await proveedor.screenshot({ path: 'test-results/reservas-recibidas-360.png', fullPage: true });
    await page.reload(); await expect(solicitud).toContainText('Rechazada');
    await expect(solicitud).toContainText('No puedo coordinar el retiro durante las fechas solicitadas.');
    await page.getByRole('button', { name: 'Recibidas', exact: true }).click();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('main')).toContainText('0 solicitudes recibidas');
  } finally { await contexto.close(); }
});
