import { expect, test } from '@playwright/test';

// En celular la cabecera muestra solo una lupa junto a la cuenta; el campo aparece al tocarla.
test.describe('cabecera en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('la lupa abre el buscador, busca y Escape lo cierra', async ({ page }) => {
    await page.goto('/');
    const lupa = page.locator('.header-search-toggle');
    const campo = page.getByRole('searchbox', { name: 'Qué estás buscando' });
    await expect(lupa).toBeVisible();
    await expect(campo).toBeHidden();

    const caja = await lupa.boundingBox();
    const cuenta = await page.getByRole('link', { name: 'Mi cuenta' }).filter({ visible: true }).first().boundingBox();
    expect(Math.abs((caja?.y ?? 0) - (cuenta?.y ?? 999))).toBeLessThan(4);

    await lupa.click();
    await expect(lupa).toHaveAttribute('aria-expanded', 'true');
    await expect(campo).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(campo).toBeHidden();
    await expect(lupa).toBeFocused();

    await lupa.click();
    await campo.fill('taladro');
    await campo.press('Enter');
    await expect(page).toHaveURL(/\/buscar\?.*q=taladro/);
  });
});

test('en computadora el campo se ve completo y no hay lupa', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox', { name: 'Qué estás buscando' })).toBeVisible();
  await expect(page.locator('.header-search-toggle')).toBeHidden();
});
