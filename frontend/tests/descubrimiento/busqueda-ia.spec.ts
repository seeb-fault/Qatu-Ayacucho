import { test, expect, type Page } from '@playwright/test';

// Búsqueda en lenguaje natural (007). Esta suite no levanta el backend: la llamada a la API se intercepta para
// probar los dos caminos del navegador, la IA respondiendo y la API caída.
const API = '**/api/v1/busqueda/intencion';
const apiCaida = (page: Page) => page.route(API, ruta => ruta.abort('connectionfailed'));

test('la IA interpreta la frase: los criterios llegan a la URL como filtros editables', async ({ page }) => {
  let enviado: unknown;
  await page.route(API, async ruta => {
    enviado = ruta.request().postDataJSON();
    await ruta.fulfill({ json: { modo: 'natural', motivo: null, criterios: { q: 'taladro', tipo: 'herramienta', categoriaId: 'perforacion', zonaId: 'ayacucho', precioMaximoCentimos: 4000 },
      fechas: { inicio: '2026-12-05', fin: null }, camposQueRequierenPrecision: ['fechas'], aviso: null, resultados: { items: [], total: 0, page: 1, limit: 20 } } });
  });
  await page.goto('/');
  await page.getByLabel('Describe lo que necesitas').fill('taladro en el centro por menos de 40 soles el sábado');
  await page.getByRole('button', { name: 'Buscar con IA' }).click();
  await expect(page).toHaveURL(/\/buscar\?/);
  expect(enviado).toEqual({ texto: 'taladro en el centro por menos de 40 soles el sábado' });
  const url = new URL(page.url());
  expect(Object.fromEntries(url.searchParams)).toMatchObject({ q: 'taladro', tipo: 'herramienta', categoria: 'perforacion', distrito: 'Ayacucho', precio: '40', ia: 'natural', desde: '2026-12-05', precisar: 'fechas' });
  const nota = page.getByRole('status').filter({ hasText: 'Interpretamos tu búsqueda' });
  await expect(nota).toContainText('Perforación');
  await expect(nota).toContainText('sábado, 5 de diciembre');
  await expect(page.getByRole('link', { name: 'Quitar filtro Hasta S/ 40' })).toBeVisible();
});

test('sin API, la búsqueda no se bloquea: busca las palabras tal cual y lo explica', async ({ page }) => {
  await apiCaida(page);
  await page.goto('/buscar');
  await page.getByLabel('Describe lo que necesitas').fill('taladro');
  await page.getByRole('button', { name: 'Buscar con IA' }).click();
  await expect(page).toHaveURL(/ia=convencional/);
  await expect(page).toHaveURL(/q=taladro/);
  await expect(page.getByRole('status').filter({ hasText: 'Buscamos tus palabras tal cual' })).toBeVisible();
  await expect(page.locator('.offer-card').first()).toBeVisible();
  await expect(page.getByLabel('Describe lo que necesitas')).toHaveValue('taladro');
});

test('desde la portada, Enter también busca', async ({ page }) => {
  await apiCaida(page);
  await page.goto('/');
  await page.getByLabel('Describe lo que necesitas').fill('podadora');
  await page.getByLabel('Describe lo que necesitas').press('Enter');
  await expect(page).toHaveURL(/\/buscar\?.*q=podadora/);
});

test('quitar un criterio interpretado lo vuelve una búsqueda convencional editable', async ({ page }) => {
  await page.goto('/buscar?tipo=herramienta&categoria=perforacion&distrito=Ayacucho&precio=40&ia=natural&consulta=' +
    encodeURIComponent('taladro en el centro por menos de 40 soles') + '&precisar=presupuesto');
  await expect(page.getByRole('status').filter({ hasText: 'Interpretamos tu búsqueda' })).toContainText('el presupuesto');
  await page.getByRole('link', { name: 'Quitar filtro Hasta S/ 40' }).click();
  await expect(page).not.toHaveURL(/precio=/);
  await expect(page.getByText('Búsqueda convencional · Edita tus criterios')).toBeVisible();
});

test('un motivo desconocido en la URL no inventa mensajes', async ({ page }) => {
  await page.goto('/buscar?q=sierra&ia=convencional&motivo=%3Cscript%3E');
  await expect(page.getByRole('status').filter({ hasText: 'La búsqueda inteligente no respondió' })).toBeVisible();
});
