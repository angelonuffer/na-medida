const { test, expect } = require('@playwright/test');

test('inicia em Consumo e navega para Alimentos', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#consumo h1')).toHaveText('Consumo');
  await expect(page.locator('#consumo')).toContainText('Aqui você pode gerenciar e planejar seu consumo.');
  await expect(page.getByRole('button', { name: /Cadastrar consumo/i })).toBeVisible();

  await page.getByRole('button', { name: /Alimentos/ }).click();

  await expect(page.locator('#alimentos h1')).toHaveText('Alimentos');
  await expect(page.locator('#alimentos')).toContainText('Aqui você pode gerenciar a base de dados de alimentos.');
  await expect(page.getByRole('button', { name: /Cadastrar alimento/i })).toBeVisible();
});
