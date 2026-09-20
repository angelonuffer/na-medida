const { test, expect } = require('@playwright/test');

test('inicia em Alimentos e navega para Consumo', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot('alimentos.png', { fullPage: true });

  await page.getByRole('button', { name: /Consumo/ }).click();

  await expect(page).toHaveScreenshot('consumo.png', { fullPage: true });
});
