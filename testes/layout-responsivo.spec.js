const { test, expect } = require('@playwright/test');

test('mantém o layout responsivo em dispositivos móveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page).toHaveScreenshot('alimentos-mobile.png', { fullPage: true });

  await page.getByRole('button', { name: /Consumo/ }).click();

  await expect(page).toHaveScreenshot('consumo-mobile.png', { fullPage: true });
});
