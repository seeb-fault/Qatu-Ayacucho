import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', api = origin + '/api/v1';
const backend = (script: string) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });
const dni = () => String(10_000_000 + Math.floor(Math.random() * 89_999_999));

test('páginas legales enlazadas desde el pie y legibles a 360 px', async ({ page }) => {
  await page.goto('/');
  const pie = page.getByRole('contentinfo');
  for (const [enlace, titulo] of [['Términos y condiciones', 'Términos y condiciones'], ['Cancelaciones y devoluciones', 'Política de cancelaciones, cambios y devoluciones'],
    ['Privacidad', 'Política de privacidad'], ['Contacto', 'Contacto'], ['Libro de Reclamaciones', 'Libro de Reclamaciones']] as const) {
    await page.goto('/');
    await pie.getByRole('link', { name: enlace, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 360, height: 900 });
  for (const ruta of ['/terminos', '/devoluciones', '/privacidad', '/contacto', '/libro-de-reclamaciones']) {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), ruta).toBe(true);
  }
  // El titular viene de la configuración: sin configurar se ve «Por definir», nunca datos inventados.
  await page.goto('/contacto');
  await expect(page.getByRole('definition').filter({ hasText: 'Por definir' }).first()).toBeVisible();
});

test('un visitante sin cuenta presenta un reclamo, recibe su constancia y la administración lo responde', async ({ page, browser }) => {
  const documento = dni();
  await page.goto('/libro-de-reclamaciones');
  const hoja = page.getByRole('form', { name: 'Hoja de reclamación' });
  await hoja.getByRole('radio', { name: 'Reclamo', exact: true }).check();
  await hoja.getByLabel('Nombre completo', { exact: true }).fill('Rosa Quispe Huamán');
  await hoja.getByLabel('Número de documento', { exact: true }).fill(documento);
  await hoja.getByLabel('Domicilio', { exact: true }).fill('Jr. Lima 123, Ayacucho');
  await hoja.getByLabel('Correo electrónico', { exact: true }).fill('rosa.e2e@example.com');
  await hoja.getByLabel('¿Qué contrataste?', { exact: true }).fill('Alquiler de taladro percutor');
  await hoja.getByLabel('Monto reclamado en soles (opcional)', { exact: true }).fill('35,50');
  await hoja.getByLabel('¿Qué ocurrió?', { exact: true }).fill('El taladro llegó sin la broca que figuraba en la publicación.');
  await hoja.getByLabel('¿Qué pides?', { exact: true }).fill('Que me devuelvan el monto del día.');
  // Un DNI de 7 dígitos pasa el navegador, pero el backend lo rechaza con un mensaje claro.
  await hoja.getByLabel('Número de documento', { exact: true }).fill('1234567');
  await hoja.getByRole('button', { name: 'Enviar hoja de reclamación' }).click();
  await expect(hoja.getByRole('alert')).toContainText('DNI');
  await hoja.getByLabel('Número de documento', { exact: true }).fill(documento);
  await hoja.getByRole('button', { name: 'Enviar hoja de reclamación' }).click();

  const constancia = page.getByRole('region', { name: 'Recibimos tu hoja de reclamación' });
  await expect(constancia).toBeVisible();
  const numero = (await constancia.getByText(/^LR-\d{4}-\d{6}$/).textContent())!;
  const codigo = (await constancia.locator('span', { hasText: /^[A-Za-z0-9_-]{12}$/ }).textContent())!;
  await expect(constancia).toContainText('S/ 35.50');
  await expect(constancia).toContainText('15 días hábiles');
  await expect(constancia.getByRole('button', { name: 'Imprimir o guardar en PDF' })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });

  // La administración la atiende y la respuesta aparece en la consulta pública.
  const admin = JSON.parse(backend('test/resenas/fixture-admin-e2e.ts'));
  const contexto = await browser.newContext(), adminPage = await contexto.newPage();
  try {
    expect((await adminPage.request.post(api + '/auth/login', { headers: { Origin: origin }, data: { email: admin.email, password: admin.password } })).status()).toBe(200);
    await adminPage.goto('/admin/reclamaciones');
    const tarjeta = adminPage.getByRole('article', { name: `Hoja ${numero}`, exact: true });
    await expect(tarjeta).toContainText('Rosa Quispe Huamán');
    await expect(tarjeta).toContainText('Correo: rosa.e2e@example.com');
    await tarjeta.getByLabel('Respuesta enviada').fill('Coordinamos con el proveedor la devolución de S/ 35.50 a tu cuenta.');
    await tarjeta.getByRole('button', { name: 'Registrar respuesta' }).click();
    await adminPage.getByRole('button', { name: 'Respondidas', exact: true }).click();
    await expect(adminPage.getByRole('article', { name: `Hoja ${numero}`, exact: true })).toContainText('Respuesta (correo)');
  } finally { await contexto.close(); }

  await page.reload();
  const consulta = page.getByRole('form', { name: 'Consultar una hoja' });
  await consulta.getByLabel('Número de hoja').fill(numero);
  await consulta.getByLabel('Código de consulta').fill('AAAAAAAAAAAA');
  await consulta.getByRole('button', { name: 'Consultar' }).click();
  await expect(consulta.getByRole('alert')).toContainText('No encontramos');
  await consulta.getByLabel('Código de consulta').fill(codigo);
  await consulta.getByRole('button', { name: 'Consultar' }).click();
  const resultado = page.getByRole('region', { name: 'Hoja de reclamación', exact: true });
  await expect(resultado).toContainText(numero);
  await expect(resultado).toContainText('Coordinamos con el proveedor la devolución');
});
