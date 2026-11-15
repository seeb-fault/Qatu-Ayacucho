import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', DIA = 86_400_000;
const backend = (script: string, ...args: string[]) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script, ...args], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });
/** Valor de datetime-local en hora de Lima (UTC-5), a `dias` desde ahora. */
const lima = (dias: number) => new Date(Date.now() + dias * DIA - 5 * 3_600_000).toISOString().slice(0, 16);

test('visitante guarda en su lista, ingresa, vuelve con el ítem agregado y envía la solicitud', async ({ page }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  await page.goto('/publicaciones/' + f.publicacionId);
  await page.getByRole('link', { name: 'Agregar a mi lista' }).click();
  await expect(page).toHaveURL(/lista=1/);
  await page.getByLabel('Inicio (hora de Lima)').fill(lima(6));
  await page.getByLabel('Fin (hora de Lima)').fill(lima(8));
  await page.getByRole('button', { name: 'Guardar en mi lista' }).click();

  // Sin sesión: pide ingresar y avisa que volverá a la publicación.
  await expect(page).toHaveURL(/\/ingresar\?siguiente=/);
  await expect(page.getByRole('note')).toContainText('volverás a la página donde estabas');
  await page.getByLabel('Correo electrónico').fill(f.clienteEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill(f.password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/reservas\/nueva\?publicacion=.*lista=1/);
  await expect(page.getByRole('status').filter({ hasText: 'Agregado a tu lista' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mi lista, 1 ítem' })).toBeVisible();
  // Guardar no crea solicitudes.
  expect((await (await page.request.get(origin + '/api/v1/reservas')).json()).items.some((s: { publicacionId: string }) => s.publicacionId === f.publicacionId)).toBe(false);

  await page.getByRole('link', { name: 'Mi lista, 1 ítem' }).click();
  const item = page.getByRole('article', { name: f.titulo, exact: true });
  await expect(item).toContainText('Listo para enviar');
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole('checkbox', { name: /Acepto el horario/ }).check();
  await page.getByRole('button', { name: /^Enviar 1 solicitud/ }).click();
  await expect(page.getByRole('heading', { name: 'Enviaste 1 solicitud' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu lista está vacía' })).toBeVisible();
  const enviadas = (await (await page.request.get(origin + '/api/v1/reservas')).json()).items.filter((s: { publicacionId: string }) => s.publicacionId === f.publicacionId);
  expect(enviadas).toHaveLength(1);
  expect(enviadas[0].estado).toBe('PENDIENTE');
});

test('el regreso tras ingresar solo acepta rutas de Qatu', async ({ page }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  for (const malicioso of ['//example.com/robo', '/\\example.com', 'https://example.com']) {
    await page.context().clearCookies();
    await page.goto('/ingresar?siguiente=' + encodeURIComponent(malicioso));
    await page.getByLabel('Correo electrónico').fill(f.clienteEmail);
    await page.getByLabel('Contraseña', { exact: true }).fill(f.password);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page).toHaveURL(origin + '/');
  }
  // Sin sesión, la lista lleva al ingreso con regreso a /lista.
  await page.context().clearCookies();
  await page.goto('/lista');
  await expect(page).toHaveURL(/\/ingresar\?siguiente=%2Flista$/);
});
