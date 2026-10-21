import { test,expect } from '@playwright/test';

test('dos adjuntos de 5 MiB atraviesan el proxy y se guardan completos',async ({ page }) => {
  test.setTimeout(90000);
  const registro = await page.request.post('/api/v1/auth/registro',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { email: `limites-web-${crypto.randomUUID()}@example.com`,nombre: 'Ensayo de límites',password: 'frase de prueba para limites de carga' } });
  expect(registro.status()).toBe(201);
  expect((await page.request.post('/api/v1/proveedores/me',{ headers: { Origin: 'http://127.0.0.1:3100' },data: { nombrePublico: 'Perfil de límites',descripcion: 'Actividad sintética para verificar límites del transporte documental.',zonaId: 'ayacucho',visiblePublicamente: false } })).status()).toBe(201);
  const contenido = Buffer.alloc(5242880,32);
  contenido.write('%PDF-1.4\n',0,'ascii');
  contenido.write('\n%%EOF',contenido.length-6,'ascii');
  await page.goto('/proveedor');
  await page.getByLabel('Documentos privados',{ exact: true }).setInputFiles([
    { name: 'limite-uno.pdf',mimeType: 'application/pdf',buffer: contenido },
    { name: 'limite-dos.pdf',mimeType: 'application/pdf',buffer: contenido },
  ]);
  await page.getByRole('checkbox',{ name: 'Acepto la política de conservación indicada.' }).check();
  await page.getByRole('button',{ name: 'Solicitar verificación',exact: true }).click();
  await expect(page.getByText('En revisión documental',{ exact: true })).toBeVisible({ timeout: 30000 });
  const response = await page.request.get('/api/v1/proveedores/me/verificaciones');
  const historial = await response.json();
  expect(historial[0].documentos).toHaveLength(2);
  expect(historial[0].documentos.map((documento: { bytes: number }) => documento.bytes)).toEqual([5242880,5242880]);
});
