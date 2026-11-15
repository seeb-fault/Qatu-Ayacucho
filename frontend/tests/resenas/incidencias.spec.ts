import { test, expect, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3100', api = origin + '/api/v1', HORA = 3_600_000;
const backend = (script: string, ...args: string[]) => execFileSync(process.execPath, ['--env-file-if-exists=.env', '--import', 'tsx', script, ...args], { cwd: resolve('../backend'), encoding: 'utf8', env: { ...process.env, QATU_E2E_RESERVAS: '1' } });
const entrar = async (request: APIRequestContext, email: string, password: string) =>
  expect((await request.post(api + '/auth/login', { headers: { Origin: origin }, data: { email, password } })).status()).toBe(200);
const ESTADO = 'Funciona bien, sin golpes; incluye maletín y dos brocas.';

test('garantía documental, reclamo del cliente y resolución por un administrador ajeno', async ({ page, browser }) => {
  const f = JSON.parse(backend('test/reservas/fixture-e2e.ts'));
  const admin = JSON.parse(backend('test/resenas/fixture-admin-e2e.ts'));
  const proveedor = await browser.newContext(), administrador = await browser.newContext();
  try {
    await entrar(page.request, f.clienteEmail, f.password); await entrar(proveedor.request, f.proveedorEmail, f.password); await entrar(administrador.request, admin.email, admin.password);
    const desde = Date.now() + 120 * HORA;
    const creada = await page.request.post(api + '/reservas', { headers: { Origin: origin }, data: { publicacionId: f.publicacionId, recursoId: f.recursoId, inicio: new Date(desde).toISOString(), fin: new Date(desde + 24 * HORA).toISOString(), aceptaCondiciones: true, tarifaEsperadaCentimos: 4250 } });
    let s = await creada.json();
    const paso = async (accion: string, quien: APIRequestContext) => { const r = await quien.post(`${api}/reservas/${s.id}/${accion}`, { headers: { Origin: origin }, data: { versionActual: s.version } }); expect(r.status(), accion).toBe(201); s = await r.json(); };
    await paso('aceptacion', proveedor.request);

    // El proveedor documenta el estado antes de entregar.
    const vista = await proveedor.newPage();
    await vista.goto('/reservas?vista=proveedor');
    await vista.getByRole('button', { name: 'Recibidas' }).click();
    const recibida = vista.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Herramienta apartada' });
    const garantiaProveedor = recibida.getByRole('region', { name: 'Garantía documental' });
    await garantiaProveedor.getByLabel('Estado y accesorios que entregas').fill(ESTADO);
    await garantiaProveedor.getByRole('button', { name: 'Guardar estado' }).click();
    await expect(garantiaProveedor).toContainText('Pendiente de conformidad del cliente.');

    await paso('efectivo', proveedor.request); await paso('recepcion', page.request);

    // El cliente da conformidad y luego reporta un problema.
    await page.goto('/reservas');
    const tarjeta = page.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Alquiler en curso' });
    const garantia = tarjeta.getByRole('region', { name: 'Garantía documental' });
    await expect(garantia).toContainText(ESTADO);
    await garantia.getByRole('button', { name: 'Recibí la herramienta en este estado' }).click();
    await expect(garantia).toContainText('Conformidad del cliente:');
    const incidencias = tarjeta.getByRole('region', { name: 'Incidencias' });
    await incidencias.getByRole('button', { name: 'Reportar un problema' }).click();
    const formulario = incidencias.getByRole('form', { name: 'Reportar un problema' });
    await formulario.getByLabel('Tipo de problema').selectOption('faltante');
    await formulario.getByLabel('Qué pasó').fill('Falta una de las dos brocas que indica el acuerdo.');
    await formulario.getByRole('button', { name: 'Enviar reporte' }).click();
    await expect(incidencias).toContainText('En revisión por la administración');
    await expect(incidencias.getByRole('button', { name: 'Reportar un problema' })).toHaveCount(0);

    // Un administrador ajeno la resuelve con motivo.
    const panel = await administrador.newPage();
    await panel.goto('/admin/incidencias');
    const caso = panel.getByRole('article', { name: 'Incidencia Faltante' }).filter({ hasText: 'Falta una de las dos brocas' });
    await caso.getByLabel('Resultado').selectOption('a_favor_cliente');
    await caso.getByLabel('Motivo de la decisión').fill('El acuerdo de entrega indica dos brocas.');
    await caso.getByRole('button', { name: 'Resolver incidencia' }).click();
    await expect(panel.getByRole('article', { name: 'Incidencia Faltante' }).filter({ hasText: 'Falta una de las dos brocas' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('article', { name: f.titulo, exact: true }).filter({ hasText: 'Alquiler en curso' }).getByRole('region', { name: 'Incidencias' }))
      .toContainText('Resuelta: A favor del cliente. El acuerdo de entrega indica dos brocas.');
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  } finally { await proveedor.close(); await administrador.close(); }
});
