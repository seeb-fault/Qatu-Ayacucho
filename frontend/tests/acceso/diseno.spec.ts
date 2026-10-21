import { test, expect } from '@playwright/test';

test('acceso y registro adaptables con navegación y contraseña visible opcional', async ({ page }) => {
  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const ruta of ['/ingresar', '/registro']) {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Acceso a tu cuenta' }).locator('[aria-current="page"]')).toHaveText(ruta === '/registro' ? 'Crear cuenta' : 'Iniciar sesión');
      const password = page.getByLabel('Contraseña', { exact: true });
      await password.fill('una frase de prueba segura');
      await expect(password).toHaveAttribute('type', 'password');
      await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'text');
      await expect(password).toHaveValue('una frase de prueba segura');
      await page.getByRole('button', { name: 'Ocultar contraseña', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'password');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/acceso-${ruta.slice(1)}-${width}.png`, fullPage: true });
    }
  }
  await page.getByRole('navigation', { name: 'Acceso a tu cuenta' }).getByRole('link', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar$/);
});

test('error de acceso accesible sin borrar los datos ingresados', async ({ page }) => {
  await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 401, json: { code: 'CREDENCIALES_INVALIDAS', mensaje: 'Correo o contraseña incorrectos.', correlationId: 'prueba-diseno' } }));
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico').fill('prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('una frase de prueba segura');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Qué bueno verte de nuevo.' }).getByRole('alert')).toContainText('Correo o contraseña incorrectos.');
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('prueba@example.com');
  await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeEnabled();
});

test('registro mantiene el contrato y dirige al perfil', async ({ page }) => {
  await page.route('**/api/v1/auth/registro', async route => {
    expect(route.request().postDataJSON()).toEqual({ nombre: 'Cliente de prueba', email: 'registro@example.com', password: 'una frase de prueba segura' });
    await route.fulfill({ status: 201, json: {} });
  });
  await page.route('**/api/v1/usuarios/me', route => route.fulfill({ json: { id: 'prueba', nombre: 'Cliente de prueba', email: 'registro@example.com', roles: ['cliente'] } }));
  await page.goto('/registro');
  await page.getByLabel('Nombre', { exact: true }).fill('Cliente de prueba');
  await page.getByLabel('Correo electrónico').fill('registro@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('una frase de prueba segura');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Cliente de prueba');
});
