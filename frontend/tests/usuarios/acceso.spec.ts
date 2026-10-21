import { test, expect } from '@playwright/test';

test('registro real → perfil → salir → ingresar', async ({ page }) => {
  const email = `web-${crypto.randomUUID()}@example.com`;
  const password = 'una frase de prueba para qatu';
  await page.goto('/registro');
  await page.getByLabel('Nombre', { exact: true }).fill('Cliente navegador');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Cliente navegador');
  await page.getByLabel('Nombre', { exact: true }).fill('Nombre actualizado');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page.getByRole('status')).toHaveText('Tu perfil se guardó.');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('link', { name: 'Ingresar a mi cuenta' })).toBeVisible();
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Nombre actualizado');
});

test('perfil privado y formulario móvil sin desborde', async ({ page }) => {
  await page.goto('/cuenta');
  await expect(page.getByRole('link', { name: 'Ingresar a mi cuenta' })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 900 });
  for (const ruta of ['/registro', '/ingresar', '/cuenta']) {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
