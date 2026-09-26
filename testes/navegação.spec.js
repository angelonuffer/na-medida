const { test, expect } = require('@playwright/test');

test('inicia em Consumo e navega para Alimentos', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot('consumo.png', { fullPage: true });

  await page.getByRole('button', { name: /Alimentos/ }).click();

  await expect(page).toHaveScreenshot('alimentos.png', { fullPage: true });
});
