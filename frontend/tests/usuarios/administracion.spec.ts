import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

test('administrador desactiva, consulta auditoría y reactiva con sesiones revocadas', async ({ page, browser }) => {
  const sufijo = crypto.randomUUID();
  const emailAdmin = `admin-web-${sufijo}@example.com`;
  const emailCliente = `cliente-admin-web-${sufijo}@example.com`;
  const password = 'frase segura para pruebas de administracion';
  execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', 'scripts/aprovisionar-admin.ts'], {
    cwd: resolve('../backend'), stdio: 'pipe',
    env: { ...process.env, QATU_ADMIN_EMAIL: emailAdmin, QATU_ADMIN_NOMBRE: 'Administrador navegador', QATU_ADMIN_PASSWORD: password, QATU_ADMIN_MOTIVO: 'Preparación de recorrido de administración' },
  });
  const cliente = await browser.newContext({ baseURL: 'http://127.0.0.1:3100' });
  try {
    const registro = await cliente.request.post('/api/v1/auth/registro', { headers: { Origin: 'http://127.0.0.1:3100' }, data: { email: emailCliente, password, nombre: 'Cliente de administración' } });
    expect(registro.status()).toBe(201);
    expect((await cliente.request.get('/api/v1/usuarios/me')).status()).toBe(200);
    await page.goto('/ingresar');
    await page.getByLabel('Correo electrónico').fill(emailAdmin);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await page.getByRole('link', { name: 'Administrar usuarios', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Administrar usuarios' })).toBeVisible();
    await page.getByLabel('Buscar por nombre o correo').fill(emailCliente);
    await page.getByRole('button', { name: 'Buscar usuarios' }).click();
    const cuenta = page.getByRole('article', { name: emailCliente, exact: true });
    await expect(cuenta).toBeVisible();
    await cuenta.getByRole('button', { name: 'Cambiar estado de Cliente de administración' }).click();
    await page.getByLabel('Motivo del cambio').fill('Incumplimiento revisado en prueba de navegador');
    await page.getByRole('button', { name: 'Confirmar cambio de estado' }).click();
    await expect(cuenta.getByText('Inactivo', { exact: true })).toBeVisible();
    expect((await cliente.request.get('/api/v1/usuarios/me')).status()).toBe(401);
    await cuenta.getByRole('button', { name: 'Ver auditoría de Cliente de administración' }).click();
    await expect(page.getByRole('heading', { name: 'Auditoría de Cliente de administración' })).toBeVisible();
    await expect(page.getByText('Incumplimiento revisado en prueba de navegador', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/usuarios-administracion-360.png', fullPage: true });
    await cuenta.getByRole('button', { name: 'Cambiar estado de Cliente de administración' }).click();
    await page.getByLabel('Motivo del cambio').fill('Revisión finalizada y cuenta rehabilitada');
    await page.getByRole('button', { name: 'Confirmar cambio de estado' }).click();
    await expect(cuenta.getByText('Activo', { exact: true })).toBeVisible();
    expect((await cliente.request.get('/api/v1/usuarios/me')).status()).toBe(401);
    expect((await cliente.request.post('/api/v1/auth/login', { headers: { Origin: 'http://127.0.0.1:3100' }, data: { email: emailCliente, password } })).status()).toBe(200);
  } finally { await cliente.close(); }
});

test('administración rechaza anónimo y cliente aunque se navegue directo a la ruta', async ({ page }) => {
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('link', { name: 'Ingresar con una cuenta administrativa' })).toBeVisible();
  const registro = await page.request.post('/api/v1/auth/registro', {
    headers: { Origin: 'http://127.0.0.1:3100' },
    data: { email: `sin-permiso-${crypto.randomUUID()}@example.com`, nombre: 'Cliente sin permiso', password: 'frase de prueba de permisos web' },
  });
  expect(registro.status()).toBe(201);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Administrar usuarios', exact: true }).getByRole('alert')).toContainText('requiere una cuenta administrativa');
  await expect(page.getByRole('link', { name: 'Volver a mi cuenta' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Cuentas de usuarios' })).toHaveCount(0);
});
