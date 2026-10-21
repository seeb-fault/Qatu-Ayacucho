import { test, expect } from '@playwright/test';

const descripcion = 'Alquiler de herramientas y mantenimiento para proyectos de nuestra comunidad.';

test('crear, recargar, mostrar y ocultar perfil de proveedor con datos persistidos', async ({ page, browser }) => {
  const email = `perfil-web-${crypto.randomUUID()}@example.com`;
  const registro = await page.request.post('/api/v1/auth/registro', { headers: { Origin: 'http://127.0.0.1:3100' }, data: { email, nombre: 'Propietario web', password: 'frase segura para pruebas de perfiles' } });
  expect(registro.status()).toBe(201);
  await page.goto('/cuenta');
  await page.getByRole('link', { name: 'Mi perfil de proveedor', exact: true }).click();
  await page.getByLabel('Nombre público', { exact: true }).fill('Taller del barrio');
  await page.getByLabel('Descripción', { exact: true }).fill(descripcion);
  await page.getByLabel('Distrito de atención', { exact: true }).selectOption('carmen-alto');
  const visible = page.getByRole('checkbox', { name: 'Mostrar públicamente mi nombre' });
  await expect(visible).not.toBeChecked();
  await page.getByRole('button', { name: 'Crear perfil de proveedor', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('se guardó');
  await page.reload();
  await expect(page.getByLabel('Nombre público', { exact: true })).toHaveValue('Taller del barrio');
  await expect(page.getByLabel('Distrito de atención', { exact: true })).toHaveValue('carmen-alto');
  await visible.check();
  await page.getByRole('button', { name: 'Guardar cambios del proveedor' }).click();
  const publico = page.getByRole('link', { name: 'Ver mi página pública' });
  await expect(publico).toBeVisible();
  const ruta = (await publico.getAttribute('href'))!;
  const anonimo = await browser.newContext({ baseURL: 'http://127.0.0.1:3100', viewport: { width: 360, height: 900 } });
  try {
    const visitante = await anonimo.newPage();
    await visitante.goto(ruta);
    await expect(visitante.getByRole('heading', { level: 1 })).toHaveText('Taller del barrio');
    await expect(visitante.getByText('Carmen Alto', { exact: true })).toBeVisible();
    await expect(visitante.getByText('Sin verificación solicitada', { exact: true })).toBeVisible();
    await expect(visitante.getByText(email, { exact: true })).toHaveCount(0);
    expect(await visitante.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await visitante.screenshot({ path: 'test-results/proveedor-publico-360.png', fullPage: true });
    await page.setViewportSize({ width: 360, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/proveedor-editor-360.png', fullPage: true });
    await visible.uncheck();
    await page.getByRole('button', { name: 'Guardar cambios del proveedor' }).click();
    await expect(publico).toHaveCount(0);
    await visitante.goto(ruta);
    await expect(visitante.getByRole('heading', { name: 'Este perfil no está disponible' })).toBeVisible();
  } finally { await anonimo.close(); }
});

test('anónimo necesita sesión y un identificador público inexistente no revela perfil', async ({ page }) => {
  await page.goto('/proveedor');
  await expect(page.getByRole('link', { name: 'Ingresar para crear mi perfil de proveedor' })).toBeVisible();
  await expect(page.getByLabel('Nombre público', { exact: true })).toHaveCount(0);
  await page.goto(`/proveedores/${crypto.randomUUID()}`);
  await expect(page.getByRole('heading', { name: 'Este perfil no está disponible' })).toBeVisible();
});

test('editar desde dos pestañas muestra conflicto y permite recargar el perfil vigente', async ({ page, context }) => {
  const registro = await page.request.post('/api/v1/auth/registro', { headers: { Origin: 'http://127.0.0.1:3100' }, data: { email: `version-web-${crypto.randomUUID()}@example.com`, nombre: 'Propietario de versiones', password: 'otra frase segura para perfiles' } });
  expect(registro.status()).toBe(201);
  const creado = await page.request.post('/api/v1/proveedores/me', { headers: { Origin: 'http://127.0.0.1:3100' }, data: { nombrePublico: 'Nombre inicial', descripcion, zonaId: 'ayacucho', visiblePublicamente: false } });
  expect(creado.status()).toBe(201);
  const segunda = await context.newPage();
  try {
    await page.goto('/proveedor');
    await segunda.goto('/proveedor');
    await expect(page.getByLabel('Nombre público', { exact: true })).toHaveValue('Nombre inicial');
    await expect(segunda.getByLabel('Nombre público', { exact: true })).toHaveValue('Nombre inicial');
    await page.getByLabel('Nombre público', { exact: true }).fill('Nombre actualizado');
    await page.getByRole('button', { name: 'Guardar cambios del proveedor' }).click();
    await expect(page.getByRole('status')).toContainText('se guardó');
    await segunda.getByLabel('Nombre público', { exact: true }).fill('Edición de otra pestaña');
    await segunda.getByRole('button', { name: 'Guardar cambios del proveedor' }).click();
    await expect(segunda.getByRole('region', { name: 'Mi perfil de proveedor' }).getByRole('alert')).toContainText('El perfil cambió');
    await segunda.getByRole('button', { name: 'Recargar perfil' }).click();
    await expect(segunda.getByLabel('Nombre público', { exact: true })).toHaveValue('Nombre actualizado');
  } finally { await segunda.close(); }
});
